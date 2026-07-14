import { useEffect, useRef, useState } from 'react';

/**
 * Fires a short boolean pulse whenever `value` changes (optionally only
 * in one direction). Drives "money changed", "took damage" style flashes.
 */
export const usePulse = <T extends number | string | boolean>(
  value: T,
  durationMs = 700,
  direction: 'any' | 'up' | 'down' = 'any',
): boolean => {
  const [active, setActive] = useState(false);
  const prev = useRef<T>(value);

  useEffect(() => {
    const before = prev.current;
    prev.current = value;
    if (before === value) return;
    if (typeof value === 'number' && typeof before === 'number') {
      if (direction === 'up' && value <= before) return;
      if (direction === 'down' && value >= before) return;
    }
    setActive(true);
    const t = window.setTimeout(() => setActive(false), durationMs);
    return () => window.clearTimeout(t);
  }, [value, durationMs, direction]);

  return active;
};
