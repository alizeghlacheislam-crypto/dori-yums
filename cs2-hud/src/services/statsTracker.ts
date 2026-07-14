import type { CSGO, KillEvent, HurtEvent, Player, Side } from 'csgogsi';
import { GSI } from './socket';
import type { DerivedPlayerStats, KillfeedEntry, PlayerMatchStats, TeamEconomySnapshot } from '../types/stats';

const TRADE_WINDOW_MS = 5000;
const UTILITY_WEAPONS = new Set(['hegrenade', 'molotov', 'inferno', 'incgrenade', 'decoy']);

interface RoundDeath {
  steamid: string;
  side: Side;
  killerId: string | null;
  time: number;
  traded: boolean;
}

function emptyStats(steamid: string): PlayerMatchStats {
  return {
    steamid,
    kills: 0,
    deaths: 0,
    assists: 0,
    headshots: 0,
    kastRounds: 0,
    roundsPlayed: 0,
    tradeKills: 0,
    tradedDeaths: 0,
    openingKills: 0,
    openingDeaths: 0,
    flashAssists: 0,
    utilityDamage: 0,
    clutchAttempts: 0,
    clutchWins: 0,
    multiKills: { k2: 0, k3: 0, k4: 0, k5: 0 },
    totalDamage: 0,
    currentStreak: 0,
    weaponKills: {},
    killPositions: []
  };
}

/**
 * Accumulates everything GSI does not hand us directly: KAST, trades,
 * opening duels, clutches, flash assists, utility damage, kill heatmap
 * positions and the per-round team economy history for the graph.
 *
 * It is a module-level singleton fed by GSI events; React components read it
 * through the useMatchStats hook which subscribes to `subscribe()`.
 */
class StatsTracker {
  private stats = new Map<string, PlayerMatchStats>();
  private listeners = new Set<() => void>();
  private feedListeners = new Set<(entry: KillfeedEntry) => void>();

  private roundDeaths: RoundDeath[] = [];
  private roundKillers = new Set<string>();
  private roundAssisters = new Set<string>();
  private roundTraded = new Set<string>();
  private roundFirstKillDone = false;
  private roundParticipants: { steamid: string; side: Side }[] = [];
  private roundNumber = 0;
  private feedId = 0;

  /** steamid of a player currently in a 1vX, with X. */
  clutch: { steamid: string; vs: number } | null = null;
  private clutchLocked = false;

  economyHistory: TeamEconomySnapshot[] = [];

  constructor() {
    GSI.on('data', data => this.onData(data));
    GSI.on('kill', kill => this.onKill(kill));
    GSI.on('hurt', hurt => this.onHurt(hurt));
    GSI.on('roundEnd', () => this.onRoundEnd());
    GSI.on('freezetimeEnd', () => this.onRoundLiveStart());
    GSI.on('matchEnd', () => this.reset());
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onKillfeed(fn: (entry: KillfeedEntry) => void): () => void {
    this.feedListeners.add(fn);
    return () => this.feedListeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private ensure(steamid: string): PlayerMatchStats {
    let s = this.stats.get(steamid);
    if (!s) {
      s = emptyStats(steamid);
      this.stats.set(steamid, s);
    }
    return s;
  }

  private onRoundLiveStart() {
    const game = GSI.current;
    if (!game) return;
    this.roundDeaths = [];
    this.roundKillers.clear();
    this.roundAssisters.clear();
    this.roundTraded.clear();
    this.roundFirstKillDone = false;
    this.clutch = null;
    this.clutchLocked = false;
    this.roundNumber = game.map.round + 1;
    this.roundParticipants = game.players.map(p => ({ steamid: p.steamid, side: p.team.side }));

    // Snapshot buy-time economy once per round for the bottom-panel graph.
    const ct = game.players.filter(p => p.team.side === 'CT');
    const t = game.players.filter(p => p.team.side === 'T');
    const sum = (list: Player[], pick: (p: Player) => number) => list.reduce((a, p) => a + pick(p), 0);
    this.economyHistory = [
      ...this.economyHistory.filter(e => e.round !== this.roundNumber),
      {
        round: this.roundNumber,
        ctEquip: sum(ct, p => p.state.equip_value),
        tEquip: sum(t, p => p.state.equip_value),
        ctMoney: sum(ct, p => p.state.money),
        tMoney: sum(t, p => p.state.money)
      }
    ].slice(-40);
    this.notify();
  }

  private onKill(kill: KillEvent) {
    const now = Date.now();
    const victim = kill.victim;
    const killer = kill.killer;
    const suicide = !killer || killer.steamid === victim.steamid;
    const teamkill = !suicide && !!killer && killer.team.side === victim.team.side;

    // ---- victim bookkeeping ----
    const vs = this.ensure(victim.steamid);
    vs.deaths += 1;
    vs.currentStreak = 0;
    if (!this.roundFirstKillDone && !suicide && !teamkill) {
      vs.openingDeaths += 1;
    }

    let trade = false;
    let revenge = false;

    if (killer && !suicide && !teamkill) {
      const ks = this.ensure(killer.steamid);
      ks.kills += 1;
      ks.currentStreak += 1;
      if (kill.headshot) ks.headshots += 1;
      ks.weaponKills[kill.weapon] = (ks.weaponKills[kill.weapon] ?? 0) + 1;
      if (!this.roundFirstKillDone) {
        ks.openingKills += 1;
        this.roundFirstKillDone = true;
      }
      this.roundKillers.add(killer.steamid);

      // Multi-kill milestones use the live round_kills the game reports.
      const rk = killer.state.round_kills;
      if (rk === 2) ks.multiKills.k2 += 1;
      else if (rk === 3) ks.multiKills.k3 += 1;
      else if (rk === 4) ks.multiKills.k4 += 1;
      else if (rk === 5) ks.multiKills.k5 += 1;

      // Trade: the victim killed one of the killer's teammates moments ago.
      const tradedDeath = this.roundDeaths.find(
        d => d.killerId === victim.steamid && d.side === killer.team.side && now - d.time <= TRADE_WINDOW_MS && !d.traded
      );
      if (tradedDeath) {
        trade = true;
        tradedDeath.traded = true;
        ks.tradeKills += 1;
        this.ensure(tradedDeath.steamid).tradedDeaths += 1;
        this.roundTraded.add(tradedDeath.steamid);
      }

      // Revenge: the victim was the last player to kill this killer this round.
      revenge = this.roundDeaths.some(d => d.steamid === killer.steamid && d.killerId === victim.steamid);

      // Kill heatmap: capture the killer's live position at the moment of the kill.
      const live = GSI.current?.players.find(p => p.steamid === killer.steamid);
      if (live && live.position.length >= 2) {
        ks.killPositions.push({ x: live.position[0], y: live.position[1], z: live.position[2] ?? 0 });
        if (ks.killPositions.length > 400) ks.killPositions.shift();
      }
    }

    if (kill.assister) {
      const as = this.ensure(kill.assister.steamid);
      as.assists += 1;
      this.roundAssisters.add(kill.assister.steamid);
      if (kill.flashed) as.flashAssists += 1;
    }

    this.roundDeaths.push({
      steamid: victim.steamid,
      side: victim.team.side,
      killerId: suicide ? null : (killer?.steamid ?? null),
      time: now,
      traded: false
    });

    // ---- killfeed fan-out ----
    const entry: KillfeedEntry = {
      id: ++this.feedId,
      timestamp: now,
      killerName: suicide ? null : (killer?.name ?? null),
      killerSide: suicide ? null : (killer?.team.side ?? null),
      victimName: victim.name,
      victimSide: victim.team.side,
      assisterName: kill.assister?.name ?? null,
      assisterSide: kill.assister?.team.side ?? null,
      weapon: kill.weapon,
      headshot: kill.headshot,
      wallbang: kill.wallbang,
      noscope: kill.noscope,
      thrusmoke: kill.thrusmoke,
      attackerblind: kill.attackerblind,
      attackerinair: kill.attackerinair,
      flashAssist: kill.flashed,
      suicide,
      teamkill,
      trade,
      revenge,
      multiKill: killer && !suicide && !teamkill ? killer.state.round_kills : 0
    };
    this.feedListeners.forEach(fn => fn(entry));
    this.notify();
  }

  private onHurt(hurt: HurtEvent) {
    if (UTILITY_WEAPONS.has(hurt.weapon)) {
      this.ensure(hurt.attacker.steamid).utilityDamage += hurt.dmg_health;
    }
  }

  private onData(game: CSGO) {
    // Clutch detection: exactly one player alive on one side vs 1+ on the other.
    if (game.round?.phase === 'live' && !this.clutchLocked) {
      const alive = game.players.filter(p => p.state.health > 0);
      const ct = alive.filter(p => p.team.side === 'CT');
      const t = alive.filter(p => p.team.side === 'T');
      if (ct.length === 1 && t.length >= 2) {
        this.startClutch(ct[0], t.length);
      } else if (t.length === 1 && ct.length >= 2) {
        this.startClutch(t[0], ct.length);
      }
    }
  }

  private startClutch(player: Player, vs: number) {
    if (this.clutch?.steamid === player.steamid) {
      // Same clutcher, enemies may have gone up? (never happens) — keep max.
      this.clutch = { steamid: player.steamid, vs: Math.max(this.clutch.vs, vs) };
      return;
    }
    this.clutch = { steamid: player.steamid, vs };
    this.clutchLocked = true;
    this.ensure(player.steamid).clutchAttempts += 1;
    this.notify();
  }

  private onRoundEnd() {
    const game = GSI.current;
    // KAST: credit kill, assist, survival or being traded.
    const survivors = new Set(
      (game?.players ?? []).filter(p => p.state.health > 0).map(p => p.steamid)
    );
    for (const { steamid } of this.roundParticipants) {
      const s = this.ensure(steamid);
      s.roundsPlayed += 1;
      if (
        this.roundKillers.has(steamid) ||
        this.roundAssisters.has(steamid) ||
        this.roundTraded.has(steamid) ||
        survivors.has(steamid)
      ) {
        s.kastRounds += 1;
      }
    }

    // Clutch conversion: the clutcher's side won the round.
    if (this.clutch && game?.round?.win_team) {
      const clutcher = game.players.find(p => p.steamid === this.clutch!.steamid);
      if (clutcher && clutcher.team.side === game.round.win_team) {
        this.ensure(this.clutch.steamid).clutchWins += 1;
      }
    }
    this.clutch = null;
    this.clutchLocked = false;

    // Pull authoritative damage numbers from csgogsi's per-round tracking.
    const totals = new Map<string, number>();
    for (const round of GSI.damage) {
      for (const p of round.players) {
        totals.set(p.steamid, (totals.get(p.steamid) ?? 0) + p.damage);
      }
    }
    totals.forEach((dmg, steamid) => {
      this.ensure(steamid).totalDamage = dmg;
    });

    this.notify();
  }

  private reset() {
    this.stats.clear();
    this.economyHistory = [];
    this.roundDeaths = [];
    this.clutch = null;
    this.clutchLocked = false;
    this.notify();
  }

  get(steamid: string): DerivedPlayerStats {
    return derive(this.stats.get(steamid) ?? emptyStats(steamid));
  }

  getAll(): DerivedPlayerStats[] {
    return [...this.stats.values()].map(derive);
  }
}

function derive(s: PlayerMatchStats): DerivedPlayerStats {
  const rounds = Math.max(1, s.roundsPlayed);
  const adr = s.totalDamage / rounds;
  const kast = (s.kastRounds / rounds) * 100;
  const kpr = s.kills / rounds;
  const dpr = s.deaths / rounds;
  const apr = s.assists / rounds;
  const impact = 2.13 * kpr + 0.42 * apr - 0.41;
  // Community approximation of the HLTV 2.0 rating formula — good enough
  // to rank players on a live overlay.
  const rating =
    0.0073 * kast + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adr + 0.1587;
  return {
    ...s,
    adr,
    kast,
    hsPercent: s.kills > 0 ? (s.headshots / s.kills) * 100 : 0,
    tradePercent: s.deaths > 0 ? (s.tradedDeaths / s.deaths) * 100 : 0,
    clutchPercent: s.clutchAttempts > 0 ? (s.clutchWins / s.clutchAttempts) * 100 : 0,
    openingSuccess:
      s.openingKills + s.openingDeaths > 0
        ? (s.openingKills / (s.openingKills + s.openingDeaths)) * 100
        : 0,
    rating: Math.max(0, rating),
    kd: s.deaths > 0 ? s.kills / s.deaths : s.kills
  };
}

export const statsTracker = new StatsTracker();
