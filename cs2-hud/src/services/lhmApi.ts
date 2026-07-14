import { lhmAddress } from './socket';
import type { LHMMatch, LHMPlayer, LHMTeam } from '@/types/hud';

/**
 * Thin client for LHM's local REST API. Every call fails soft (null /
 * empty array) so the HUD keeps rendering from raw GSI when the API is
 * unreachable — e.g. when previewing the HUD in a plain browser tab.
 */
const get = async <T>(path: string): Promise<T | null> => {
  try {
    const res = await fetch(`${lhmAddress}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export const fetchCurrentMatch = async (): Promise<LHMMatch | null> => {
  const match = await get<LHMMatch | LHMMatch[]>('/api/match/current');
  if (!match) return null;
  // Older LHM builds return the list; pick the flagged match.
  if (Array.isArray(match)) return match.find((m) => m.current) ?? null;
  return match;
};

export const fetchTeam = (id: string): Promise<LHMTeam | null> =>
  get<LHMTeam>(`/api/teams/${id}`);

export const fetchPlayers = async (): Promise<LHMPlayer[]> =>
  (await get<LHMPlayer[]>('/api/players')) ?? [];

/** LHM serves stored images (team logos, avatars) through these routes. */
export const teamLogoUrl = (teamId: string): string =>
  `${lhmAddress}/api/teams/logo/${teamId}`;

export const playerAvatarUrl = (steamid: string): string =>
  `${lhmAddress}/api/players/avatar/steamid/${steamid}`;
