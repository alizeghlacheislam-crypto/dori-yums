import { useEffect } from 'react';

/**
 * Scales the fixed 1920×1080 design canvas to the real viewport.
 * Height-fit keeps vertical composition identical on 1080p/1440p/4K;
 * ultrawide (21:9) letterboxes horizontally around the game feed.
 */
export const useHUDScale = (): void => {
  useEffect(() => {
    const apply = () => {
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      document.documentElement.style.setProperty('--hud-scale', String(scale));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
};
