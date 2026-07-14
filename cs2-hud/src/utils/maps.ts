import type { Vec3 } from '@/types/hud';

/**
 * Radar calibration per map, matching Valve's overview definitions:
 * world → radar-UV via  u = (x - pos_x) / (scale * 1024)
 *                        v = (pos_y - y) / (scale * 1024)
 * (radar textures are 1024×1024; v grows downward on screen).
 *
 * `splitZ` marks multi-level maps: positions below the threshold render
 * on the "lower" styling. `siteA`/`siteB` are approximate bomb-site
 * world-space centres used to label plants — tune freely per event.
 */
export interface MapRadarConfig {
  posX: number;
  posY: number;
  scale: number;
  splitZ?: number;
  siteA: readonly [number, number];
  siteB: readonly [number, number];
  displayName: string;
}

export const MAP_CONFIGS: Record<string, MapRadarConfig> = {
  de_ancient: {
    posX: -2953, posY: 2164, scale: 5,
    siteA: [-1580, -800], siteB: [-350, 1800], displayName: 'Ancient',
  },
  de_anubis: {
    posX: -2796, posY: 3328, scale: 5.22,
    siteA: [1400, 2400], siteB: [-950, 2750], displayName: 'Anubis',
  },
  de_dust2: {
    posX: -2476, posY: 3239, scale: 4.4,
    siteA: [1140, 2450], siteB: [-1580, 2660], displayName: 'Dust II',
  },
  de_inferno: {
    posX: -2087, posY: 3870, scale: 4.9,
    siteA: [2080, 350], siteB: [330, 2880], displayName: 'Inferno',
  },
  de_mirage: {
    posX: -3230, posY: 1713, scale: 5,
    siteA: [-370, -2050], siteB: [-2130, 500], displayName: 'Mirage',
  },
  de_nuke: {
    posX: -3453, posY: 2887, scale: 7, splitZ: -495,
    siteA: [700, -820], siteB: [620, -960], displayName: 'Nuke',
  },
  de_overpass: {
    posX: -4831, posY: 1781, scale: 5.2,
    siteA: [-1650, 340], siteB: [-3050, 1200], displayName: 'Overpass',
  },
  de_train: {
    posX: -2308, posY: 2078, scale: 4.08,
    siteA: [500, -280], siteB: [180, -1200], displayName: 'Train',
  },
  de_vertigo: {
    posX: -3168, posY: 1762, scale: 4, splitZ: 11700,
    siteA: [-1420, -560], siteB: [-2320, 780], displayName: 'Vertigo',
  },
  de_cache: {
    posX: -2000, posY: 3250, scale: 5.5,
    siteA: [230, -100], siteB: [-100, 1600], displayName: 'Cache',
  },
};

export const mapConfig = (mapName: string): MapRadarConfig | undefined =>
  MAP_CONFIGS[mapName.replace(/^.*\//, '')];

export const mapDisplayName = (mapName: string): string =>
  mapConfig(mapName)?.displayName ?? mapName.replace(/^de_|^cs_/, '').replace(/^\w/, (c) => c.toUpperCase());

/** World position → radar UV in [0,1]². */
export const worldToRadar = (cfg: MapRadarConfig, pos: Vec3): { u: number; v: number } => ({
  u: (pos[0] - cfg.posX) / (cfg.scale * 1024),
  v: (cfg.posY - pos[1]) / (cfg.scale * 1024),
});

/** Nearest bomb site to a world position. Nuke stacks sites vertically, so use Z. */
export const nearestSite = (cfg: MapRadarConfig, pos: Vec3, mapName?: string): 'A' | 'B' => {
  if (mapName === 'de_nuke') return pos[2] > -550 ? 'A' : 'B';
  const dA = Math.hypot(pos[0] - cfg.siteA[0], pos[1] - cfg.siteA[1]);
  const dB = Math.hypot(pos[0] - cfg.siteB[0], pos[1] - cfg.siteB[1]);
  return dA <= dB ? 'A' : 'B';
};
