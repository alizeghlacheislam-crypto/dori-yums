import { getSocket } from './socket';
import { fetchCurrentMatch, fetchTeam } from './lhmApi';
import { parseState, resolveLeftSide } from './gsiParser';
import { StatsTracker } from './statsTracker';
import { createDetectorMemory, detectKills, type DetectorMemory } from './killDetector';
import type { RawGSIData } from '@/types/gsi';
import type { ClutchState, HUDState, KillEvent, LHMMatch, LHMTeam } from '@/types/hud';

export interface EngineEvents {
  state: HUDState;
  kill: KillEvent;
  /** enrichment for an already-emitted kill (HLAE mirv flags) */
  killUpdate: Partial<KillEvent> & { id: string };
  roundStart: number;
  roundEnd: { winner: 'CT' | 'T'; round: number };
  bombPlant: string | undefined;
  bombDefused: undefined;
  bombExploded: undefined;
  matchData: LHMMatch | null;
}

type Listener<T> = (payload: T) => void;

/**
 * The single stateful core of the HUD. Consumes the LHM socket feed,
 * derives events by diffing consecutive frames, keeps long-lived match
 * stats, and publishes an immutable `HUDState` per frame. React only
 * ever subscribes — all game logic lives here, outside the render loop.
 */
class GSIEngine {
  private listeners = new Map<keyof EngineEvents, Set<Listener<never>>>();
  private tracker = new StatsTracker();
  private memory: DetectorMemory = createDetectorMemory();
  private prevRaw: RawGSIData | null = null;
  private lhmMatch: LHMMatch | null = null;
  private leftTeam: LHMTeam | null = null;
  private rightTeam: LHMTeam | null = null;
  private clutch: ClutchState | undefined;
  private connected = false;
  private currentMap = '';
  private started = false;
  private lastState: HUDState | null = null;
  private recentKillIds: Array<{ id: string; victim: string; time: number }> = [];

  on<K extends keyof EngineEvents>(event: K, fn: Listener<EngineEvents[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as Listener<never>);
    return () => set?.delete(fn as Listener<never>);
  }

  private emit<K extends keyof EngineEvents>(event: K, payload: EngineEvents[K]): void {
    this.listeners.get(event)?.forEach((fn) => (fn as Listener<EngineEvents[K]>)(payload));
  }

  get state(): HUDState | null {
    return this.lastState;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    const socket = getSocket();

    socket.on('connect', () => {
      this.connected = true;
      void this.refreshMatchData();
    });
    socket.on('disconnect', () => {
      this.connected = false;
      if (this.prevRaw) this.publish(this.prevRaw);
    });
    socket.on('update', (raw: RawGSIData) => this.onFrame(raw));
    socket.on('update_mirv', (payload: unknown) => this.onMirv(payload));
    // LHM notifies HUDs when match config changes in the dashboard.
    socket.on('match', () => void this.refreshMatchData());
    socket.on('db_update', () => void this.refreshMatchData());

    // Match data safety net — the dashboard can change it at any time.
    window.setInterval(() => void this.refreshMatchData(), 30000);
  }

  private async refreshMatchData(): Promise<void> {
    const match = await fetchCurrentMatch();
    this.lhmMatch = match;
    if (match?.left.id) this.leftTeam = await fetchTeam(match.left.id);
    if (match?.right.id) this.rightTeam = await fetchTeam(match.right.id);
    this.emit('matchData', match);
    if (this.prevRaw) this.publish(this.prevRaw);
  }

  /* ---------------------------------------------------------------- */

  private onFrame(raw: RawGSIData): void {
    this.connected = true;
    const prev = this.prevRaw;

    // Map change or fresh warmup ⇒ new game: wipe every accumulator.
    const mapName = raw.map?.name ?? '';
    if (mapName && mapName !== this.currentMap) {
      this.currentMap = mapName;
      this.tracker.reset();
      this.memory = createDetectorMemory();
      this.clutch = undefined;
    }

    if (raw.map && raw.map.phase !== 'warmup') this.tracker.seedRounds(raw.map.round);
    this.tracker.ingestFrame(raw);

    if (prev) {
      this.detectRoundTransitions(prev, raw);
      this.detectBombTransitions(prev, raw);

      const now = Date.now();
      const kills = detectKills(prev, raw, this.memory, now);
      for (const kill of kills) {
        // KAST trade credit: this kill avenged whoever the victim just killed.
        if (kill.isTrade) {
          for (const rk of this.memory.recentKills) {
            if (rk.attacker === kill.victim.steamid) this.tracker.markTraded(rk.victim);
          }
        }
        this.tracker.ingestKill(kill, kill.attacker?.side);
        this.recentKillIds.push({ id: kill.id, victim: kill.victim.steamid, time: now });
        this.emit('kill', kill);
      }
      this.recentKillIds = this.recentKillIds.filter((k) => now - k.time < 4000);

      this.updateClutch(raw);
    }

    this.prevRaw = raw;
    this.publish(raw);
  }

  private publish(raw: RawGSIData): void {
    this.lastState = parseState(raw, {
      lhmMatch: this.lhmMatch,
      leftTeam: this.orientedTeam('left'),
      rightTeam: this.orientedTeam('right'),
      tracker: this.tracker,
      clutch: this.clutch,
      connected: this.connected,
    });
    this.emit('state', this.lastState);
  }

  /**
   * LHM's REST match pins teams to broadcast left/right; hand the parser
   * the metadata for whichever team currently plays each orientation.
   */
  private orientedTeam(orientation: 'left' | 'right'): LHMTeam | null {
    if (!this.prevRaw) return orientation === 'left' ? this.leftTeam : this.rightTeam;
    const leftSide = resolveLeftSide(this.prevRaw, this.lhmMatch);
    // leftTeam/rightTeam are stored by LHM match orientation already.
    void leftSide;
    return orientation === 'left' ? this.leftTeam : this.rightTeam;
  }

  private detectRoundTransitions(prev: RawGSIData, curr: RawGSIData): void {
    const prevPhase = prev.round?.phase;
    const currPhase = curr.round?.phase;

    if (prevPhase !== 'over' && currPhase === 'over' && curr.round?.win_team) {
      const alive = new Set(
        Object.entries(curr.allplayers ?? {})
          .filter(([, p]) => (p.state?.health ?? 0) > 0)
          .map(([steamid]) => steamid),
      );
      const roundKills = new Map(
        Object.entries(curr.allplayers ?? {}).map(([steamid, p]) => [
          steamid,
          p.state?.round_kills ?? 0,
        ]),
      );
      this.tracker.roundEnded(alive, roundKills);

      if (this.clutch && curr.round.win_team === this.clutch.side) {
        this.clutch = { ...this.clutch, won: true };
        this.tracker.clutchWon(this.clutch.steamid);
      }
      this.emit('roundEnd', { winner: curr.round.win_team, round: curr.map?.round ?? 0 });
    }

    if (prevPhase !== 'freezetime' && currPhase === 'freezetime') {
      this.tracker.roundStarted();
      this.clutch = undefined;
      this.emit('roundStart', (curr.map?.round ?? 0) + 1);
    }
  }

  private detectBombTransitions(prev: RawGSIData, curr: RawGSIData): void {
    const a = prev.bomb?.state;
    const b = curr.bomb?.state;
    if (a === b) return;
    if (b === 'planted') this.emit('bombPlant', curr.bomb?.player);
    if (b === 'defused') this.emit('bombDefused', undefined);
    if (b === 'exploded') this.emit('bombExploded', undefined);
  }

  /**
   * Clutch detection: the moment a side drops to its last living player
   * while at least two opponents stand, that player is in a clutch. The
   * opponent count only ratchets down (1v4 → 1v3 …), and a second clutch
   * cannot start in the same round once one is registered.
   */
  private updateClutch(raw: RawGSIData): void {
    if (raw.round?.phase !== 'live') return;
    const players = Object.entries(raw.allplayers ?? {});
    const aliveCT = players.filter(([, p]) => p.team === 'CT' && (p.state?.health ?? 0) > 0);
    const aliveT = players.filter(([, p]) => p.team === 'T' && (p.state?.health ?? 0) > 0);

    if (!this.clutch) {
      if (aliveCT.length === 1 && aliveT.length >= 2) {
        this.clutch = { steamid: aliveCT[0][0], side: 'CT', opponents: aliveT.length, won: false };
        this.tracker.clutchStarted(this.clutch.steamid);
      } else if (aliveT.length === 1 && aliveCT.length >= 2) {
        this.clutch = { steamid: aliveT[0][0], side: 'T', opponents: aliveCT.length, won: false };
        this.tracker.clutchStarted(this.clutch.steamid);
      }
      return;
    }

    const enemies = this.clutch.side === 'CT' ? aliveT.length : aliveCT.length;
    if (enemies < this.clutch.opponents && enemies > 0) {
      this.clutch = { ...this.clutch, opponents: enemies };
    }
  }

  /**
   * HLAE / mirv `player_death` events carry flags GSI cannot observe
   * (wallbang penetration, true no-scopes). When present, patch the
   * matching kill we already emitted. Payload shape is defensive —
   * different HLAE versions nest keys differently.
   */
  private onMirv(payload: unknown): void {
    if (!payload || typeof payload !== 'object') return;
    const data = payload as Record<string, unknown>;
    const name = data.name ?? data.event;
    if (name !== 'player_death') return;
    const keys = (data.keys ?? data.data ?? {}) as Record<string, unknown>;

    const xuidOf = (v: unknown): string | undefined => {
      if (!v) return undefined;
      if (typeof v === 'object') return String((v as Record<string, unknown>).xuid ?? '');
      return String(v);
    };
    const victimXuid = xuidOf(keys.userid);
    if (!victimXuid) return;

    const match = this.recentKillIds.find((k) => k.victim === victimXuid);
    if (!match) return;

    const flag = (k: string): boolean => keys[k] === true || keys[k] === 1 || keys[k] === '1';
    this.emit('killUpdate', {
      id: match.id,
      wallbang: Number(keys.penetrated ?? 0) > 0,
      noscope: flag('noscope'),
      throughSmoke: flag('thrusmoke'),
      attackerBlind: flag('attackerblind'),
      attackerAirborne: flag('attackerinair'),
      isRevenge: flag('revenge'),
    });
  }
}

export const engine = new GSIEngine();
