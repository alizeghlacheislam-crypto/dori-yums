import type { Transition, Variants } from 'framer-motion';

/* Broadcast-grade motion language.
   Hard rule: nothing runs longer than 400ms, everything uses cubic-bezier. */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_SNAP: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const t = (duration = 0.28, delay = 0): Transition => ({
  duration: Math.min(duration, 0.4),
  delay,
  ease: EASE
});

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: t(0.32) },
  exit: { opacity: 0, y: -16, transition: t(0.2) }
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: t(0.32) },
  exit: { opacity: 0, y: 16, transition: t(0.2) }
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: t(0.3) },
  exit: { opacity: 0, x: -24, transition: t(0.2) }
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: t(0.3) },
  exit: { opacity: 0, x: 24, transition: t(0.2) }
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: t(0.24) },
  exit: { opacity: 0, transition: t(0.18) }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: t(0.28) },
  exit: { opacity: 0, scale: 0.95, transition: t(0.18) }
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.34, ease: EASE_SNAP }
  },
  exit: { opacity: 0, scale: 0.8, transition: t(0.16) }
};

/** Stagger container for lists (player cards, lineups, veto rows). */
export const staggerChildren = (stagger = 0.05, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } }
});

/** Killfeed rows enter from the right and collapse away smoothly. */
export const killfeedRow: Variants = {
  hidden: { opacity: 0, x: 48, height: 0 },
  visible: {
    opacity: 1,
    x: 0,
    height: 'auto',
    transition: { duration: 0.3, ease: EASE }
  },
  exit: { opacity: 0, x: 24, height: 0, transition: { duration: 0.24, ease: EASE_SNAP } }
};

/** Full-screen overlay panels (intro, veto, MVP, winner). */
export const overlay: Variants = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: { opacity: 1, scale: 1, transition: t(0.36) },
  exit: { opacity: 0, scale: 0.99, transition: t(0.24) }
};
