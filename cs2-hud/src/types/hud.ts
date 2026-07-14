/**
 * Parsed domain model consumed by every HUD component.
 * Produced once per GSI frame by `services/gsiParser`.
 */

import type { BombState, CountdownPhase, GrenadeType, MapPhase, RoundPhase, RoundWinCause, Side } from './gsi';

export type Vec3 = readonly [number, number, number];

export type WeaponCategory =
  | 'pistol'
  | 'smg'
  | 'rifle'
  | 'sniper'
  | 'shotgun'
  | 'machinegun'
  | 'knife'
  | 'grenade'
  | 'taser'
  | 'c4';

export interface Weapon {
  /** Canonical id without the `weapon_` prefix, e.g. `ak47` */
  id: string;
  displayName: string;
  category: WeaponCategory;
  state: 'active' | 'holstered' | 'reloading';
  ammoClip: number;
  ammoClipMax: number;
  ammoReserve: number;
}

export type PlayerRole = 'igl' | 'awper' | 'support' | 'anchor' | 'lurker' | 'entry';

export interface PlayerMatchTotals {
  kills: number;
  assists: number;
  deaths: number;
  mvps: number;
  score: number;
}

/** Rolling stats accumulated by the StatsTracker across rounds. */
export interface PlayerComputedStats {
  adr: number;
  kast: number;
  rating: number;
  headshotPct: number;
  totalDamage: number;
  utilityDamage: number;
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
}

export interface Player {
  steamid: string;
  name: string;
  realName?: string;
  country?: string;
  avatar?: string;
  role?: PlayerRole;
  observerSlot: number;
  side: Side;
  alive: boolean;
  health: number;
  armor: number;
  helmet: boolean;
  defuseKit: boolean;
  flashed: number;
  smoked: number;
  burning: number;
  money: number;
  equipValue: number;
  roundKills: number;
  roundKillsHS: number;
  roundDamage: number;
  stats: PlayerMatchTotals;
  computed: PlayerComputedStats;
  weapons: Weapon[];
  activeWeapon?: Weapon;
  primaryWeapon?: Weapon;
  secondaryWeapon?: Weapon;
  grenades: Weapon[];
  hasBomb: boolean;
  hasKnife: boolean;
  hasTaser: boolean;
  isScoped: boolean;
  isReloading: boolean;
  isPlanting: boolean;
  isDefusing: boolean;
  position: Vec3;
  forward: Vec3;
  isObserved: boolean;
}

export interface TeamInfo {
  id?: string;
  name: string;
  shortName: string;
  side: Side;
  orientation: 'left' | 'right';
  score: number;
  seriesScore: number;
  consecutiveLosses: number;
  timeoutsRemaining: number;
  logo?: string;
  country?: string;
  coach?: string;
  players: Player[];
  aliveCount: number;
  totalMoney: number;
  totalEquipValue: number;
  lossBonus: number;
}

export interface RoundHistoryEntry {
  round: number;
  winner: Side;
  cause: RoundWinCause;
  /** which orientation (left/right) won, resolved against side swaps */
  winnerOrientation: 'left' | 'right';
}

export interface BombInfo {
  state: BombState;
  position: Vec3;
  countdown: number;
  /** steamid of the player planting/defusing/carrying */
  playerSteamid?: string;
  site?: 'A' | 'B';
}

export interface GrenadeInfo {
  id: string;
  type: GrenadeType;
  owner?: string;
  ownerSide?: Side;
  position: Vec3;
  lifetime: number;
  effecttime: number;
  flames: Vec3[];
}

export interface MatchState {
  mapName: string;
  mapPhase: MapPhase;
  roundNumber: number;
  roundPhase: RoundPhase;
  bombRoundState?: 'planted' | 'exploded' | 'defused';
  roundWinTeam?: Side;
  phase: CountdownPhase;
  phaseEndsIn: number;
  isPaused: boolean;
  timeoutSide?: Side;
  isFreezetime: boolean;
  isWarmup: boolean;
  isOvertime: boolean;
  matchPointFor?: 'left' | 'right';
  mapPointFor?: 'left' | 'right';
  bestOf: number;
  roundWins: RoundHistoryEntry[];
}

export interface ClutchState {
  steamid: string;
  side: Side;
  opponents: number;
  /** true once the clutcher wins the round */
  won: boolean;
}

export interface HUDState {
  connected: boolean;
  left: TeamInfo;
  right: TeamInfo;
  players: Player[];
  observed?: Player;
  observerSteamid?: string;
  match: MatchState;
  bomb?: BombInfo;
  grenades: GrenadeInfo[];
  clutch?: ClutchState;
  winProbabilityLeft: number;
  frameTimestamp: number;
}

/* ------------------------------------------------------------------ */
/* Kill feed                                                           */
/* ------------------------------------------------------------------ */

export interface KillEvent {
  id: string;
  timestamp: number;
  attacker?: { name: string; side: Side; steamid: string };
  victim: { name: string; side: Side; steamid: string };
  assister?: { name: string; side: Side; steamid: string; flashAssist: boolean };
  weaponId: string;
  weaponCategory: WeaponCategory;
  headshot: boolean;
  wallbang: boolean;
  noscope: boolean;
  throughSmoke: boolean;
  attackerBlind: boolean;
  attackerAirborne: boolean;
  isTeamkill: boolean;
  isSuicide: boolean;
  isTrade: boolean;
  isRevenge: boolean;
  /** 2 = collateral double, 3+ = multi collateral (same frame, same attacker) */
  collateralCount: number;
  /** attacker's kill number in the current round (1-5) */
  multiKillIndex: number;
}

/* ------------------------------------------------------------------ */
/* LHM REST entities                                                   */
/* ------------------------------------------------------------------ */

export interface LHMTeam {
  _id: string;
  name: string;
  shortName?: string;
  country?: string;
  logo?: string;
  extra?: Record<string, string>;
}

export interface LHMPlayer {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  avatar?: string;
  country?: string;
  steamid: string;
  team?: string;
  extra?: Record<string, string>;
}

export interface LHMVetoEntry {
  teamId: string;
  mapName: string;
  side: Side | 'NO';
  type: 'ban' | 'pick' | 'decider';
  score?: { [teamId: string]: number };
  reverseSide?: boolean;
  winner?: string;
  mapEnd: boolean;
}

export interface LHMMatch {
  id: string;
  current: boolean;
  left: { id: string | null; wins: number };
  right: { id: string | null; wins: number };
  matchType: 'bo1' | 'bo2' | 'bo3' | 'bo5';
  vetos: LHMVetoEntry[];
}
