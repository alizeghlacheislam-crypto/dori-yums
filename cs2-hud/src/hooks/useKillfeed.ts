import { useEffect, useState } from 'react';
import { statsTracker } from '../services/statsTracker';
import type { KillfeedEntry } from '../types/stats';
import { GSI } from '../services/socket';

const ENTRY_TTL_MS = 6000;

/**
 * Rolling killfeed: new entries push in from the tracker, expire after 6s,
 * and the whole feed clears when a new round goes live.
 */
export function useKillfeed(limit: number): KillfeedEntry[] {
  const [entries, setEntries] = useState<KillfeedEntry[]>([]);

  useEffect(() => {
    const offFeed = statsTracker.onKillfeed(entry => {
      setEntries(prev => [...prev.slice(-(limit - 1)), entry]);
    });

    const clear = () => setEntries([]);
    GSI.on('freezetimeEnd', clear);

    const interval = window.setInterval(() => {
      const cutoff = Date.now() - ENTRY_TTL_MS;
      setEntries(prev => (prev.some(e => e.timestamp < cutoff) ? prev.filter(e => e.timestamp >= cutoff) : prev));
    }, 500);

    return () => {
      offFeed();
      GSI.off('freezetimeEnd', clear);
      window.clearInterval(interval);
    };
  }, [limit]);

  return entries;
}
