import { useSyncExternalStore, useCallback } from 'react';
import { statsTracker } from '../services/statsTracker';
import type { DerivedPlayerStats } from '../types/stats';

/**
 * useSyncExternalStore requires referentially-stable snapshots, so derived
 * stats are memoised per tracker version: everything is recomputed at most
 * once per tracker notification, never once per render.
 */
let version = 0;
let cachedVersion = -1;
let cachedAll: DerivedPlayerStats[] = [];
let cachedById = new Map<string, DerivedPlayerStats>();

statsTracker.subscribe(() => {
  version += 1;
});

function snapshot(): void {
  if (cachedVersion === version) return;
  cachedAll = statsTracker.getAll();
  cachedById = new Map(cachedAll.map(s => [s.steamid, s]));
  cachedVersion = version;
}

function getForPlayer(steamid: string): DerivedPlayerStats {
  snapshot();
  let s = cachedById.get(steamid);
  if (!s) {
    // Unknown player (no events yet): memoise an empty record so the
    // reference stays stable until the tracker actually changes.
    s = statsTracker.get(steamid);
    cachedById.set(steamid, s);
  }
  return s;
}

const subscribe = (cb: () => void) => statsTracker.subscribe(cb);

/** Reactive access to the live stats tracker for a single player. */
export function usePlayerStats(steamid: string): DerivedPlayerStats {
  const get = useCallback(() => getForPlayer(steamid), [steamid]);
  return useSyncExternalStore(subscribe, get);
}

/** Reactive snapshot of every tracked player's derived stats. */
export function useAllStats(): DerivedPlayerStats[] {
  return useSyncExternalStore(subscribe, () => {
    snapshot();
    return cachedAll;
  });
}

/** Currently active 1vX situation, if any. */
export function useClutch() {
  return useSyncExternalStore(subscribe, () => statsTracker.clutch);
}

/** Per-round team economy history for the bottom-panel graph. */
export function useEconomyHistory() {
  return useSyncExternalStore(subscribe, () => statsTracker.economyHistory);
}
