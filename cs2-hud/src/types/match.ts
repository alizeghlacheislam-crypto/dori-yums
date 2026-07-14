/** Match / veto structures as served by the Lexogrine HUD Manager REST API. */

export interface VetoItem {
  teamId: string;
  mapName: string;
  side: 'CT' | 'T' | 'NO';
  type: 'ban' | 'pick' | 'decider';
  score?: { [teamId: string]: number } | null;
  reverseSide?: boolean;
  winner?: string | null;
  mapEnd: boolean;
}

export interface MatchTeamSlot {
  id: string | null;
  wins: number;
}

export interface MatchData {
  id: string;
  current: boolean;
  left: MatchTeamSlot;
  right: MatchTeamSlot;
  matchType: 'bo1' | 'bo2' | 'bo3' | 'bo5';
  vetos: VetoItem[];
  startTime?: number;
  game?: string;
}

export interface LHMTeam {
  _id: string;
  name: string;
  shortName?: string | null;
  country?: string | null;
  logo?: string | null;
  extra?: Record<string, string>;
}

export interface LHMPlayer {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  username: string;
  avatar?: string | null;
  country?: string | null;
  steamid: string;
  team?: string | null;
  extra?: Record<string, string>;
}
