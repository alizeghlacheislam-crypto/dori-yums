import { useEffect, useState, type ReactNode } from 'react';
import styles from './HUDLayout.module.css';

/**
 * Fixed 1920×1080 authoring canvas, uniformly scaled to the viewport.
 * 1080p renders 1:1, 1440p at 1.33×, 4K at 2×; on 21:9 ultrawide the HUD
 * stays centred over the 16:9 game frame.
 */
export function HUDLayout({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className={`hud-canvas ${styles.canvas}`} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
      {children}
    </div>
  );
}
