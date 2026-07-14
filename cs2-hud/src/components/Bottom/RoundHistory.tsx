import { memo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './RoundHistory.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { BombIcon, DefuseKitIcon, SkullIcon, TimerIcon } from '@/assets/icons/Icons';
import { useGSI } from '@/contexts/GSIContext';
import { useConfig } from '@/contexts/ConfigContext';
import { slideIn } from '@/animations/variants';
import { cn } from '@/utils/cn';
import type { RoundHistoryEntry } from '@/types/hud';
import type { RoundWinCause } from '@/types/gsi';

const CauseIcon = ({ cause }: { cause: RoundWinCause }) => {
  switch (cause) {
    case 'ct_win_defuse':
      return <DefuseKitIcon size={8} />;
    case 't_win_bomb':
      return <BombIcon size={8} />;
    case 'ct_win_time':
      return <TimerIcon size={8} />;
    default:
      return <SkullIcon size={8} />;
  }
};

/**
 * Per-round win markers, split into halves, shown during freezetime and
 * round-over so it never fights the action for attention.
 */
export const RoundHistory = memo(() => {
  const { match, left, right } = useGSI();
  const config = useConfig();

  const visible =
    config.modules.showRoundHistory &&
    !match.isWarmup &&
    (match.isFreezetime || match.roundPhase === 'over') &&
    match.roundWins.length > 0;

  const vars = {
    '--left-color': left.side === 'CT' ? 'var(--ct)' : 'var(--t)',
    '--right-color': right.side === 'CT' ? 'var(--ct)' : 'var(--t)',
  } as CSSProperties;

  // Split into halves for readability (12 regulation rounds per half).
  const halves: RoundHistoryEntry[][] = [[], [], []];
  const shown = match.roundWins.slice(-config.layout.roundHistoryRounds);
  for (const entry of shown) {
    halves[entry.round <= 12 ? 0 : entry.round <= 24 ? 1 : 2].push(entry);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div variants={slideIn('up', 16)} initial="hidden" animate="visible" exit="exit">
          <GlassPanel card className={styles.root} style={vars}>
            {halves
              .filter((h) => h.length > 0)
              .map((half, hi, all) => (
                <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={styles.half}>
                    {half.map((entry) => (
                      <div key={entry.round} className={styles.cell}>
                        <span
                          className={cn(
                            styles.marker,
                            entry.winnerOrientation === 'left'
                              ? styles.markerLeftWin
                              : styles.markerRightWin,
                          )}
                          title={`Round ${entry.round}`}
                        >
                          <CauseIcon cause={entry.cause} />
                        </span>
                        <span className={styles.roundNum}>{entry.round}</span>
                      </div>
                    ))}
                  </div>
                  {hi < all.length - 1 && <div className={styles.divider} />}
                </div>
              ))}
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
RoundHistory.displayName = 'RoundHistory';
