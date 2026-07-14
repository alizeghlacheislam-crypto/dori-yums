import { motion } from 'framer-motion';
import styles from './ObserverPanel.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { slideRight } from '../../animations';
import { CameraIcon, EyeIcon } from '../shared/Icons';

/**
 * Production-crew widget: who the observer is looking at and in which camera
 * mode, so the director can glance at the program feed and know the state.
 */
export function ObserverPanel() {
  const { game } = useHUD();
  if (!game) return null;

  const spectarget = game.observer.spectarget;
  const freecam = spectarget === 'free' || !spectarget;
  const target = !freecam ? game.players.find(p => p.steamid === spectarget) : null;
  const observerName = game.provider.steamid ? `OBS ${game.provider.steamid.slice(-6)}` : 'OBSERVER';

  return (
    <motion.div className={styles.panel} variants={slideRight} initial="hidden" animate="visible" exit="exit">
      <div className={styles.header}>
        <CameraIcon size={13} />
        <span>{observerName}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.mode} data-free={freecam}>
          {freecam ? 'FREECAM' : 'PLAYER CAM'}
        </span>
        {target && (
          <span className={styles.target} data-side={target.team.side}>
            <EyeIcon size={12} />
            {target.name}
          </span>
        )}
      </div>
      <div className={styles.hint}>XRAY {game.observer.activity === 'playing' ? 'LIVE' : 'STANDBY'}</div>
    </motion.div>
  );
}
