import type { Variants } from 'framer-motion';
import { DUR_FAST, DUR_MED, DUR_SLOW, EASE_OUT, EASE_SNAP } from './easing';

/** Slide in from a screen edge — panels entering play. */
export const slideIn = (dir: 'left' | 'right' | 'up' | 'down', dist = 24): Variants => {
  const offset =
    dir === 'left'
      ? { x: -dist }
      : dir === 'right'
        ? { x: dist }
        : dir === 'up'
          ? { y: -dist }
          : { y: dist };
  return {
    hidden: { opacity: 0, ...offset },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: DUR_MED, ease: EASE_OUT } },
    exit: { opacity: 0, ...offset, transition: { duration: DUR_FAST, ease: EASE_OUT } },
  };
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR_MED, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: DUR_FAST, ease: EASE_OUT } },
};

export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: DUR_MED, ease: EASE_SNAP } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: DUR_FAST, ease: EASE_OUT } },
};

/** Stagger children — team lineups, stat rows. */
export const staggerChildren = (stagger = 0.05): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
  exit: {},
});

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR_MED, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR_FAST, ease: EASE_OUT } },
};

/** Killfeed rows: slide + collapse away. */
export const feedRow: Variants = {
  hidden: { opacity: 0, x: 42, height: 0 },
  visible: {
    opacity: 1,
    x: 0,
    height: 'auto',
    transition: { duration: DUR_MED, ease: EASE_OUT },
  },
  exit: { opacity: 0, x: 24, height: 0, transition: { duration: DUR_FAST, ease: EASE_OUT } },
};

/** Full-screen overlay curtain. */
export const overlayCurtain: Variants = {
  hidden: { opacity: 0, scale: 1.02 },
  visible: { opacity: 1, scale: 1, transition: { duration: DUR_SLOW, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.99, transition: { duration: DUR_MED, ease: EASE_OUT } },
};
