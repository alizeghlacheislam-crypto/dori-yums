import type { LHMPlayer, LHMTeam, MatchData } from '../types/match';

/**
 * Lexogrine HUD Manager REST client.
 * In development the HUD runs on its own dev server, so it talks to LHM on
 * its default port; in production LHM serves the HUD itself and the API is
 * same-origin.
 */
export const isDev = import.meta.env.DEV;
export const API_ADDRESS = isDev ? 'http://localhost:1349/' : '/';
export const SOCKET_ADDRESS = isDev ? 'http://localhost:1349/' : '/';

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_ADDRESS}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  match: {
    /** Returns the match flagged as current, trying the dedicated endpoint first. */
    async getCurrent(): Promise<MatchData | null> {
      const direct = await get<MatchData>('api/match/current');
      if (direct && typeof direct === 'object' && 'id' in direct) return direct;
      const all = await get<MatchData[]>('api/match');
      if (Array.isArray(all)) return all.find(m => m.current) ?? null;
      return null;
    }
  },
  teams: {
    getOne: (id: string) => get<LHMTeam>(`api/teams/${id}`)
  },
  players: {
    getAll: () => get<LHMPlayer[]>('api/players')
  }
};

/** LHM stores logos/avatars either as absolute URLs or API-relative paths. */
export function resolveAsset(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_ADDRESS}${url.replace(/^\//, '')}`;
}
