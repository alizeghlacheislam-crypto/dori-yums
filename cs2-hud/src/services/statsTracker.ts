import type { KillEvent, PlayerComputedStats } from '@/types/hud';
import type { RawGSIData, RawGrenade } from '@/types/gsi';
import { computeRating, headshotPct } from '@/utils/stats';

interface RoundFlags {
  kill: boolean;
  assist: boolean;
  survived: boolean;
  traded: boolean;
}

interface MutableStats {
  totalDamage: number;
  utilityDamage: number;
  kastRounds: number;
  hsKills: number;
  killsSeen: number;
  flashAssists: number;
  tradeKills: number;
  entryAttempts: number;
  entryWins: number;
  openingKills: number;
  openingDeaths: number;
  clutchAttempts: number;
  clutchWins: number;
  multiKillRounds: number;
  currentKillStreak: number;
  weaponKills: Record<string, number>;
  round: RoundFlags;
}

const freshRound = (): RoundFlags => ({ kill: false, assist: false, survived: false, traded: false });

const freshStats = (): MutableStats => ({
  totalDamage: 0,
  utilityDamage: 0,
  kastRounds: 0,
  hsKills: 0,
  killsSeen: 0,
  flashAssists: 0,
  tradeKills: 0,
  entryAttempts: 0,
  entryWins: 0,
  openingKills: 0,
  openingDeaths: 0,
  clutchAttempts: 0,
  clutchWins: 0,
  multiKillRounds: 0,
  currentKillStreak: 0,
  weaponKills: {},
  round: freshRound(),
});

const UTILITY_GRENADES = new Set(['frag', 'firebomb', 'inferno']);

/**
 * Accumulates everything GSI does not give us directly — ADR, KAST,
 * trades, entry duels, clutches, utility damage — by observing frame
 * deltas and kill events across the whole map.
 */
export class StatsTracker {
  private stats = new Map<string, MutableStats>();
  /** round_totaldmg snapshot per player for the round in progress */
  private roundDamage = new Map<string, number>();
  private prevGrenades: Record<string, RawGrenade> = {};
  private roundsCompleted = 0;
  private firstKillSeenThisRound = false;
  private roundClosed = false;

  private of(steamid: string): MutableStats {
    let s = this.stats.get(steamid);
    if (!s) {
      s = freshStats();
      this.stats.set(steamid, s);
    }
    return s;
  }

  get completedRounds(): number {
    return this.roundsCompleted;
  }

  /**
   * When the HUD attaches to a match already in progress, the scoreboard
   * says N rounds happened but this tracker saw none of them. Seeding the
   * round count keeps per-round rates (ADR, rating) on a sane denominator.
   */
  seedRounds(rounds: number): void {
    if (this.roundsCompleted === 0 && rounds > 0) this.roundsCompleted = rounds;
  }

  reset(): void {
    this.stats.clear();
    this.roundDamage.clear();
    this.prevGrenades = {};
    this.roundsCompleted = 0;
    this.firstKillSeenThisRound = false;
    this.roundClosed = false;
  }

  /**
   * Per-frame damage bookkeeping. Utility damage cannot be read from GSI,
   * so we use a tight heuristic: a damage delta counts as utility damage
   * when the dealer currently owns burning fire on the ground, or one of
   * their HE grenades detonated on this exact frame (it existed in the
   * previous grenade snapshot and vanished in this one).
   */
  ingestFrame(raw: RawGSIData): void {
    const players = raw.allplayers ?? {};
    const grenades = raw.grenades ?? {};

    // Which players had an HE vanish (=detonate) this frame or own live fire?
    const utilityActive = new Set<string>();
    for (const [id, g] of Object.entries(this.prevGrenades)) {
      if (g.type === 'frag' && g.owner && !grenades[id]) utilityActive.add(g.owner);
    }
    for (const g of Object.values(grenades)) {
      if (g.owner && UTILITY_GRENADES.has(g.type) && g.type !== 'frag') utilityActive.add(g.owner);
    }

    for (const [steamid, p] of Object.entries(players)) {
      const dmg = p.state?.round_totaldmg ?? 0;
      const prev = this.roundDamage.get(steamid) ?? 0;
      if (dmg > prev && utilityActive.has(steamid)) {
        this.of(steamid).utilityDamage += dmg - prev;
      }
      this.roundDamage.set(steamid, dmg);
    }

    this.prevGrenades = grenades;
  }

  ingestKill(event: KillEvent, attackerSide?: 'CT' | 'T'): void {
    const { attacker, victim, assister } = event;

    if (attacker && !event.isSuicide && !event.isTeamkill) {
      const a = this.of(attacker.steamid);
      a.round.kill = true;
      a.killsSeen += 1;
      a.currentKillStreak += 1;
      if (event.headshot) a.hsKills += 1;
      if (event.isTrade) a.tradeKills += 1;
      a.weaponKills[event.weaponId] = (a.weaponKills[event.weaponId] ?? 0) + 1;

      // Opening duel: the first kill of the round.
      if (!this.firstKillSeenThisRound) {
        a.openingKills += 1;
        this.of(victim.steamid).openingDeaths += 1;
        // Entry attempts are opening duels taken on the attacking (T) side.
        if (attackerSide === 'T') {
          a.entryAttempts += 1;
          a.entryWins += 1;
        } else {
          const v = this.of(victim.steamid);
          if (victim.side === 'T') v.entryAttempts += 1;
        }
      }
    }

    if (!this.firstKillSeenThisRound) this.firstKillSeenThisRound = true;

    const v = this.of(victim.steamid);
    v.currentKillStreak = 0;

    if (assister) {
      const as = this.of(assister.steamid);
      as.round.assist = true;
      if (assister.flashAssist) as.flashAssists += 1;
    }
  }

  /** The victim of an earlier kill got traded — credit their KAST 'T'. */
  markTraded(steamid: string): void {
    this.of(steamid).round.traded = true;
  }

  clutchStarted(steamid: string): void {
    this.of(steamid).clutchAttempts += 1;
  }

  clutchWon(steamid: string): void {
    this.of(steamid).clutchWins += 1;
  }

  /**
   * Close out the round: bank damage into ADR totals, resolve KAST and
   * multi-kill rounds, then reset per-round flags. `aliveSteamids` are
   * players standing when the round ended; `roundKills` is each player's
   * final `state.round_kills`.
   */
  roundEnded(aliveSteamids: Set<string>, roundKills: Map<string, number>): void {
    if (this.roundClosed) return;
    this.roundClosed = true;
    this.roundsCompleted += 1;

    for (const [steamid, dmg] of this.roundDamage) {
      this.of(steamid).totalDamage += dmg;
    }
    for (const [steamid, s] of this.stats) {
      if (aliveSteamids.has(steamid)) s.round.survived = true;
      const flags = s.round;
      if (flags.kill || flags.assist || flags.survived || flags.traded) s.kastRounds += 1;
      if ((roundKills.get(steamid) ?? 0) >= 2) s.multiKillRounds += 1;
    }
  }

  roundStarted(): void {
    this.roundClosed = false;
    this.firstKillSeenThisRound = false;
    this.roundDamage.clear();
    for (const s of this.stats.values()) s.round = freshRound();
  }

  computedFor(steamid: string, kills: number): PlayerComputedStats {
    const s = this.stats.get(steamid) ?? freshStats();
    const rounds = Math.max(1, this.roundsCompleted);
    return {
      adr: s.totalDamage / rounds,
      kast: this.roundsCompleted > 0 ? s.kastRounds / this.roundsCompleted : 0,
      rating: computeRating(kills, this.deathsProxy(steamid, kills), s.multiKillRounds, rounds),
      headshotPct: headshotPct(s.hsKills, Math.max(kills, s.killsSeen)),
      totalDamage: s.totalDamage,
      utilityDamage: s.utilityDamage,
      flashAssists: s.flashAssists,
      tradeKills: s.tradeKills,
      entryAttempts: s.entryAttempts,
      entryWins: s.entryWins,
      openingKills: s.openingKills,
      openingDeaths: s.openingDeaths,
      clutchAttempts: s.clutchAttempts,
      clutchWins: s.clutchWins,
      multiKillRounds: s.multiKillRounds,
      currentKillStreak: s.currentKillStreak,
      weaponKills: s.weaponKills,
    };
  }

  /** Deaths come from match_stats at parse time; engine passes them in. */
  private deathsBySteamid = new Map<string, number>();

  setDeaths(steamid: string, deaths: number): void {
    this.deathsBySteamid.set(steamid, deaths);
  }

  private deathsProxy(steamid: string, _kills: number): number {
    return this.deathsBySteamid.get(steamid) ?? 0;
  }
}
