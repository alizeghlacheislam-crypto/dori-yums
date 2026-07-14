import { memo } from 'react';
import styles from './HealthBar.module.css';

const colorFor = (hp: number): string => {
  if (hp > 60) return 'var(--hp-high)';
  if (hp > 25) return 'var(--hp-mid)';
  return 'var(--hp-low)';
};

export interface HealthBarProps {
  value: number;
  max?: number;
  /** override fill color (e.g. side color) */
  color?: string;
}

/** HP bar with a red "damage ghost" that trails the real value. */
export const HealthBar = memo(({ value, max = 100, color }: HealthBarProps) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={styles.track}>
      <div className={styles.ghost} style={{ width: `${pct}%` }} />
      <div
        className={styles.fill}
        style={{ width: `${pct}%`, backgroundColor: color ?? colorFor(value) }}
      />
    </div>
  );
});
HealthBar.displayName = 'HealthBar';
