import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Player } from 'csgogsi';
import styles from './Overlays.module.css';
import { GSI } from '../../services/socket';
import { statsTracker } from '../../services/statsTracker';
import { initials } from '../../utils/players';
import { pct, ratio } from '../../utils/format';
import { popIn, slideUp } from '../../animations';
import { StarIcon } from '../shared/Icons';

/** Round-MVP lower third, auto-triggered by the GSI mvp event. */
export function MVPOverlay() {
  const [mvp, setMvp] = useState<Player | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    let timer = 0;
    const onMvp = (player: Player) => {
      setAvatarFailed(false);
      setMvp(player);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMvp(null), 5000);
    };
    const onFreezeEnd = () => setMvp(null);
    GSI.on('mvp', onMvp);
    GSI.on('freezetimeEnd', onFreezeEnd);
    return () => {
      GSI.off('mvp', onMvp);
      GSI.off('freezetimeEnd', onFreezeEnd);
      window.clearTimeout(timer);
    };
  }, []);

  const stats = mvp ? statsTracker.get(mvp.steamid) : null;

  return (
    <AnimatePresence>
      {mvp && stats && (
        <motion.div className={styles.mvpRoot} variants={slideUp} initial="hidden" animate="visible" exit="exit">
          <motion.div className={styles.mvpCard} data-side={mvp.team.side} variants={popIn}>
            <div className={styles.mvpStar}>
              <StarIcon size={26} />
            </div>
            <div className={styles.mvpAvatarBox}>
              {mvp.avatar && !avatarFailed ? (
                <img src={mvp.avatar} alt="" onError={() => setAvatarFailed(true)} />
              ) : (
                <span>{initials(mvp.name)}</span>
              )}
            </div>
            <div className={styles.mvpText}>
              <span className={styles.mvpLabel}>ROUND MVP</span>
              <span className={styles.mvpName}>{mvp.name}</span>
              <span className={styles.mvpStats}>
                {mvp.state.round_kills} K THIS ROUND · {stats.kills}-{stats.deaths} · ADR{' '}
                {Math.round(stats.adr)} · HS {pct(stats.hsPercent)} · RATING {ratio(stats.rating)}
              </span>
            </div>
            <div className={`${styles.mvpCount} mono`}>
              <StarIcon size={12} /> {mvp.stats.mvps}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
