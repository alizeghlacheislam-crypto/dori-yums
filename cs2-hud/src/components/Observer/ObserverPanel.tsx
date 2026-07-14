import { memo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ObserverPanel.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { CameraIcon } from '@/assets/icons/Icons';
import { useGSI } from '@/contexts/GSIContext';
import { useConfig, useOverlays } from '@/contexts/ConfigContext';
import { slideIn } from '@/animations/variants';
import { cn } from '@/utils/cn';

/**
 * Production-facing observer panel (Alt+O or the module toggle):
 * current camera mode (player cam vs freecam), the observed target,
 * the 1–0 slot map with alive states, and X-ray status. Meant for the
 * observer/director monitor rather than the public program feed.
 */
export const ObserverPanel = memo(() => {
  const { players, observed, connected } = useGSI();
  const config = useConfig();
  const overlays = useOverlays();

  const visible = overlays.observerPanel || overlays.cams || config.modules.showObserverPanel;
  const freecam = !observed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div variants={slideIn('right', 24)} initial="hidden" animate="visible" exit="exit">
          <GlassPanel className={styles.root} accent="top" accentColor="var(--accent)">
            <div className={styles.header}>
              <span>Observer</span>
              <span>{connected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <div className={styles.mode}>
              <CameraIcon size={14} className={styles.modeIcon} />
              {freecam ? 'FREECAM' : 'PLAYER CAM'}
            </div>
            {observed && (
              <div className={styles.target}>
                Following <b>{observed.name}</b> · slot {observed.observerSlot}
              </div>
            )}
            <div className={styles.slots}>
              {players.map((p) => (
                <div
                  key={p.steamid}
                  className={cn(
                    styles.slot,
                    p.isObserved && styles.slotActive,
                    !p.alive && styles.slotDead,
                  )}
                  style={
                    { '--side-color': p.side === 'CT' ? 'var(--ct)' : 'var(--t)' } as CSSProperties
                  }
                >
                  <span className={styles.slotKey}>{p.observerSlot}</span>
                  <span className={styles.slotName}>{p.name}</span>
                </div>
              ))}
            </div>
            <div className={styles.xray}>
              <span>X-RAY</span>
              <span className={styles.xrayOn}>ENABLED</span>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
ObserverPanel.displayName = 'ObserverPanel';
