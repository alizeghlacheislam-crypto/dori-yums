import { useEffect, useRef, useState } from 'react';
import { engine } from '@/services/engine';
import type { KillEvent } from '@/types/hud';

const ENTRY_TTL_MS = 7000;

/**
 * Live killfeed entries. New kills push in from the engine, mirv
 * enrichments patch entries in place, and entries expire after a few
 * seconds or when the round resets.
 */
export const useKillfeed = (maxEntries: number): KillEvent[] => {
  const [entries, setEntries] = useState<KillEvent[]>([]);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    const offKill = engine.on('kill', (kill) => {
      setEntries((list) => [...list, kill].slice(-maxEntries));
      timeouts.current.push(
        window.setTimeout(
          () => setEntries((list) => list.filter((e) => e.id !== kill.id)),
          ENTRY_TTL_MS,
        ),
      );
    });
    const offUpdate = engine.on('killUpdate', (patch) => {
      setEntries((list) => list.map((e) => (e.id === patch.id ? { ...e, ...patch } : e)));
    });
    const offRound = engine.on('roundStart', () => setEntries([]));
    return () => {
      offKill();
      offUpdate();
      offRound();
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [maxEntries]);

  return entries;
};
