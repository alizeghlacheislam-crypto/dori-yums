/** Shared cubic-bezier curves — every animation in the HUD uses these. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];
export const EASE_SNAP: [number, number, number, number] = [0.34, 1.4, 0.64, 1];

/** Durations in seconds. Hard ceiling: 400ms. */
export const DUR_FAST = 0.16;
export const DUR_MED = 0.26;
export const DUR_SLOW = 0.38;
