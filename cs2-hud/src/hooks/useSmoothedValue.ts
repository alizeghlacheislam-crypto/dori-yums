import { useEffect, useRef, useState } from 'react';

/**
 * Exponential smoothing over a stream of numbers, updated on rAF.
 * Keeps the win-probability bar calm instead of twitching every frame.
 */
export const useSmoothedValue = (target: number, halfLifeMs = 600): number => {
  const [value, setValue] = useState(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const alpha = 1 - Math.pow(0.5, dt / halfLifeMs);
      setValue((v) => {
        const next = v + (targetRef.current - v) * alpha;
        return Math.abs(next - targetRef.current) < 0.0005 ? targetRef.current : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [halfLifeMs]);

  return value;
};
