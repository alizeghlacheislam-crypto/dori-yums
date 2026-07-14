import { AnimatePresence, motion } from 'framer-motion';
import styles from './Overlays.module.css';
import { useRoundClock } from '../../hooks/useRoundClock';
import { clock } from '../../utils/format';
import { fade, popIn } from '../../animations';
import { PauseIcon, TimerIcon } from '../shared/Icons';

/** Tactical timeout / technical pause takeover, driven purely by GSI phase. */
export function PauseOverlay() {
  const roundClock = useRoundClock();
  const active = roundClock.paused || roundClock.timeout !== null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div className={`zone-overlay ${styles.pauseRoot}`} variants={fade} initial="hidden" animate="visible" exit="exit">
          <motion.div className={styles.pauseCard} variants={popIn} initial="hidden" animate="visible" exit="exit">
            {roundClock.timeout ? (
              <>
                <TimerIcon size={28} />
                <span className={styles.pauseTitle}>TACTICAL TIMEOUT</span>
                <span className={styles.pauseTeam} data-side={roundClock.timeout}>
                  {roundClock.timeoutTeamName ?? roundClock.timeout}
                </span>
                <span className={`${styles.pauseClock} mono`}>{clock(roundClock.timeLeft)}</span>
              </>
            ) : (
              <>
                <PauseIcon size={28} />
                <span className={styles.pauseTitle}>TECHNICAL PAUSE</span>
                <span className={styles.pauseSub}>MATCH WILL RESUME SHORTLY</span>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
