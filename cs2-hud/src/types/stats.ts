/** Per-player statistics accumulated live from GSI + MIRV events. */
export interface PlayerMatchStats {
  steamid: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  /** Rounds in which the player got a Kill, Assist, Survived or was Traded. */
  kastRounds: number;
  roundsPlayed: number;
  /** Kills that answered a teammate's death within the trade window. */
  tradeKills: number;
  /** Deaths that were answered by a teammate within the trade window. */
  tradedDeaths: number;
  /** First kill / first death of the round (opening duels). */
  openingKills: number;
  openingDeaths: number;
  flashAssists: number;
  utilityDamage: number;
  clutchAttempts: number;
  clutchWins: number;
  multiKills: { k2: number; k3: number; k4: number; k5: number };
  /** Damage dealt per round index (from csgogsi damage tracking). */
  totalDamage: number;
  /** Current kill streak inside the ongoing round series (resets on death). */
  currentStreak: number;
  weaponKills: Record<string, number>;
  /** World-space positions where this player scored kills (for heatmaps). */
  killPositions: { x: number; y: number; z: number }[];
}

export interface DerivedPlayerStats extends PlayerMatchStats {
  adr: number;
  kast: number;
  hsPercent: number;
  tradePercent: number;
  clutchPercent: number;
  openingSuccess: number;
  rating: number;
  kd: number;
}

/** One rendered entry of the killfeed. */
export interface KillfeedEntry {
  id: number;
  timestamp: number;
  killerName: string | null;
  killerSide: 'CT' | 'T' | null;
  victimName: string;
  victimSide: 'CT' | 'T';
  assisterName: string | null;
  assisterSide: 'CT' | 'T' | null;
  weapon: string;
  headshot: boolean;
  wallbang: boolean;
  noscope: boolean;
  thrusmoke: boolean;
  attackerblind: boolean;
  attackerinair: boolean;
  flashAssist: boolean;
  suicide: boolean;
  teamkill: boolean;
  trade: boolean;
  revenge: boolean;
  /** Killer's kill count in the current round, for the multi-kill counter. */
  multiKill: number;
}

export interface TeamEconomySnapshot {
  round: number;
  ctEquip: number;
  tEquip: number;
  ctMoney: number;
  tMoney: number;
}
