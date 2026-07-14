import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './StateBanners.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { PauseIcon, ReplayIcon } from '@/assets/icons/Icons';
import { useGSI } from '@/contexts/GSIContext';
import { useOverlays } from '@/contexts/ConfigContext';
import { formatClock } from '@/utils/format';
import { scalePop, fade } from '@/animations/variants';

/**
 * Match-state banners: technical pause, tactical timeouts and the
 * replay frame. Pause/timeout are driven straight by GSI phase; the
 * replay frame is toggled by the observer via the Alt+R action and
 * carries a running timer so production can see replay duration.
 */
export const StateBanners = memo(() => {
  const { match, left, right } = useGSI();
  const overlays = useOverlays();

  const timeoutTeam = match.timeoutSide
    ? match.timeoutSide === left.side
      ? left
      : right
    : undefined;

  return (
    <>
      <AnimatePresence>
        {match.isPaused && (
          <motion.div key="pause" variants={scalePop} initial="hidden" animate="visible" exit="exit">
            <GlassPanel className={styles.strip}>
              <div className={styles.stripTitle}>
                <PauseIcon size={22} className={styles.pauseIcon} />
                Technical pause
              </div>
              <div className={styles.stripSub}>The match will resume shortly</div>
            </GlassPanel>
          </motion.div>
        )}

        {timeoutTeam && (
          <motion.div key="timeout" variants={scalePop} initial="hidden" animate="visible" exit="exit">
            <GlassPanel className={styles.strip}>
              <div
                className={`${styles.stripTitle} ${
                  timeoutTeam.side === 'CT' ? styles.timeoutCT : styles.timeoutT
                }`}
              >
                <PauseIcon size={22} />
                {timeoutTeam.name} timeout
              </div>
              <div className={styles.stripSub}>
                Tactical timeout · {formatClock(match.phaseEndsIn)}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ReplayFrame active={overlays.replay} />
    </>
  );
});
StateBanners.displayName = 'StateBanners';

const ReplayFrame = memo(({ active }: { active: boolean }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => window.clearInterval(interval);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div key="replay" variants={fade} initial="hidden" animate="visible" exit="exit">
          <div className={styles.replayCorners} />
          <GlassPanel className={styles.replayWatermark}>
            <ReplayIcon size={15} />
            REPLAY
            <span className={styles.replayTimer}>{formatClock(elapsed)}</span>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
ReplayFrame.displayName = 'ReplayFrame';
