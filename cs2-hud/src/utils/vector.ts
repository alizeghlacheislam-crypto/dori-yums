import type { Vec3 } from '@/types/hud';

/** Parse a GSI vector string `"x, y, z"` into a numeric tuple. */
export const parseVec3 = (raw?: string): Vec3 => {
  if (!raw) return [0, 0, 0];
  const parts = raw.split(',').map((v) => Number.parseFloat(v.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

export const distance2D = (a: Vec3, b: Vec3): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Yaw angle (degrees) of a forward vector, for radar view cones. */
export const yawOf = (forward: Vec3): number =>
  (Math.atan2(forward[1], forward[0]) * 180) / Math.PI;
