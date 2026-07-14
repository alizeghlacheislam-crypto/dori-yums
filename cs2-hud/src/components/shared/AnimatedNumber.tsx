import { memo, useEffect, useRef, useState } from 'react';

export interface AnimatedNumberProps {
  value: number;
  /** formatter applied to the interpolated value */
  format?: (v: number) => string;
  durationMs?: number;
  className?: string;
}

/**
 * Tween-counts between values (money, damage, scores). Uses rAF with an
 * ease-out curve instead of spring physics so a $16k swing still settles
 * inside the 400ms animation budget.
 */
export const AnimatedNumber = memo(
  ({ value, format = (v) => String(Math.round(v)), durationMs = 350, className }: AnimatedNumberProps) => {
    const [display, setDisplay] = useState(value);
    const fromRef = useRef(value);
    const rafRef = useRef(0);

    useEffect(() => {
      const from = fromRef.current;
      if (from === value) return;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = from + (value - from) * eased;
        setDisplay(current);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          fromRef.current = value;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }, [value, durationMs]);

    return <span className={className}>{format(display)}</span>;
  },
);
AnimatedNumber.displayName = 'AnimatedNumber';
