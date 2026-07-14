/**
 * Raw CS2 Game State Integration payload types, as forwarded by
 * Lexogrine HUD Manager over its socket.io `update` event.
 *
 * LHM enriches the raw Valve payload: players gain `realName`, `country`,
 * `avatar` and `extra` fields when a matching player exists in the LHM
 * database, and team objects gain `id`, `logo` and `extra` when a match
 * is loaded. All LHM-added fields are optional here so the HUD keeps
 * working against a bare GSI feed.
 */

export type Side = 'CT' | 'T';

export type MapPhase = 'warmup' | 'live' | 'intermission' | 'gameover';

export type RoundPhase = 'freezetime' | 'live' | 'over';

export type BombRoundState = 'planted' | 'exploded' | 'defused';

export type PlayerActivity = 'playing' | 'menu' | 'textinput';

export interface RawProvider {
  name: string;
  appid: number;
  version: number;
  steamid: string;
  timestamp: number;
}

export interface RawTeamState {
  score: number;
  consecutive_round_losses: number;
  timeouts_remaining: number;
  matches_won_this_series: number;
  /** LHM extensions */
  id?: string;
  name?: string;
  flag?: string;
  logo?: string;
  extra?: Record<string, string>;
}

export type RoundWinCause =
  | 'ct_win_elimination'
  | 'ct_win_defuse'
  | 'ct_win_time'
  | 't_win_elimination'
  | 't_win_bomb';

export interface RawMap {
  mode: string;
  name: string;
  phase: MapPhase;
  round: number;
  team_ct: RawTeamState;
  team_t: RawTeamState;
  num_matches_to_win_series: number;
  current_spectators?: number;
  souvenirs_total?: number;
  round_wins?: Record<string, RoundWinCause>;
}

export interface RawRound {
  phase: RoundPhase;
  bomb?: BombRoundState;
  win_team?: Side;
}

export interface RawPlayerState {
  health: number;
  armor: number;
  helmet: boolean;
  defusekit?: boolean;
  flashed: number;
  smoked: number;
  burning: number;
  money: number;
  round_kills: number;
  round_killhs: number;
  round_totaldmg: number;
  equip_value: number;
}

export interface RawPlayerMatchStats {
  kills: number;
  assists: number;
  deaths: number;
  mvps: number;
  score: number;
}

export interface RawWeapon {
  name: string;
  paintkit: string;
  type?: string;
  state: 'active' | 'holstered' | 'reloading';
  ammo_clip?: number;
  ammo_clip_max?: number;
  ammo_reserve?: number;
}

export interface RawPlayer {
  steamid?: string;
  clan?: string;
  name: string;
  observer_slot?: number;
  team?: Side;
  activity?: PlayerActivity;
  state?: RawPlayerState;
  match_stats?: RawPlayerMatchStats;
  weapons?: Record<string, RawWeapon>;
  position?: string;
  forward?: string;
  spectarget?: string;
  /** LHM extensions */
  realName?: string | null;
  country?: string | null;
  avatar?: string | null;
  extra?: Record<string, string>;
}

export type BombState =
  | 'carried'
  | 'dropped'
  | 'planting'
  | 'planted'
  | 'defusing'
  | 'defused'
  | 'exploded';

export interface RawBomb {
  state: BombState;
  position: string;
  player?: string;
  countdown?: string;
}

export type GrenadeType = 'smoke' | 'flashbang' | 'frag' | 'firebomb' | 'decoy' | 'inferno';

export interface RawGrenade {
  owner?: string;
  position?: string;
  velocity?: string;
  lifetime?: string;
  type: GrenadeType;
  effecttime?: string;
  /** inferno flame cluster positions, keyed by flame id */
  flames?: Record<string, string>;
}

export type CountdownPhase =
  | 'live'
  | 'over'
  | 'freezetime'
  | 'bomb'
  | 'defuse'
  | 'paused'
  | 'timeout_ct'
  | 'timeout_t'
  | 'warmup';

export interface RawPhaseCountdowns {
  phase: CountdownPhase;
  phase_ends_in: string;
}

export interface RawGSIData {
  provider?: RawProvider;
  map?: RawMap;
  round?: RawRound;
  player?: RawPlayer;
  allplayers?: Record<string, RawPlayer>;
  bomb?: RawBomb;
  grenades?: Record<string, RawGrenade>;
  phase_countdowns?: RawPhaseCountdowns;
  auth?: Record<string, string>;
  previously?: unknown;
  added?: unknown;
}
