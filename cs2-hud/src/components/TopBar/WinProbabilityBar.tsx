import { memo, type CSSProperties } from 'react';
import styles from './WinProbabilityBar.module.css';
import { useSmoothedValue } from '@/hooks/useSmoothedValue';
import type { Side } from '@/types/gsi';

export interface WinProbabilityBarProps {
  /** probability the LEFT team wins the round, 0..1 */
  value: number;
  leftSide: Side;
  rightSide: Side;
}

export const WinProbabilityBar = memo(({ value, leftSide, rightSide }: WinProbabilityBarProps) => {
  const smoothed = useSmoothedValue(value, 700);
  const pct = Math.round(smoothed * 100);
  const vars = {
    '--left-color': leftSide === 'CT' ? 'var(--ct)' : 'var(--t)',
    '--right-color': rightSide === 'CT' ? 'var(--ct)' : 'var(--t)',
  } as CSSProperties;

  return (
    <div className={styles.wrap} style={vars} title="Live round win probability">
      <span className={styles.label}>{pct}%</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${smoothed * 100}%` }} />
        <div className={styles.notch} />
      </div>
      <span className={`${styles.label} ${styles.labelRight}`}>{100 - pct}%</span>
    </div>
  );
});
WinProbabilityBar.displayName = 'WinProbabilityBar';
