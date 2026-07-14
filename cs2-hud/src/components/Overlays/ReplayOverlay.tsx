import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Overlays.module.css';
import { fade, slideLeft } from '../../animations';
import { ReplayIcon } from '../shared/Icons';

/**
 * Replay framing: corner watermark + running replay timer, with sweeping
 * wipe transitions on entry/exit so cuts to the replay feed read cleanly.
 */
export function ReplayOverlay({ visible }: { visible: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!visible) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const id = window.setInterval(() => setElapsed((Date.now() - started) / 1000), 100);
    return () => window.clearInterval(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className={`zone-overlay ${styles.replayRoot}`} variants={fade} initial="hidden" animate="visible" exit="exit">
          {/* wipe bars */}
          <motion.div
            className={styles.replayWipeTop}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
          />
          <motion.div
            className={styles.replayWipeBottom}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
          />
          <motion.div className={styles.replayBadge} variants={slideLeft} initial="hidden" animate="visible" exit="exit">
            <ReplayIcon size={18} />
            <span className={styles.replayLabel}>REPLAY</span>
            <span className={`${styles.replayTimer} mono`}>{elapsed.toFixed(1)}s</span>
          </motion.div>
          <div className={styles.replayWatermark}>REPLAY</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
