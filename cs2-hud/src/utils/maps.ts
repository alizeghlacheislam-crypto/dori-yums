/**
 * Radar projection data per map, matching the game's overview definitions.
 * World → radar: rx = (x - pos_x) / scale ; ry = (pos_y - y) / scale
 * with radar space normalised to a 1024×1024 plane.
 */
export interface MapLevel {
  /** Players with world Z below this belong to the lower level. */
  splitZ: number;
}

export interface MapConfig {
  pos_x: number;
  pos_y: number;
  scale: number;
  /** Optional vertical split for two-level maps (Nuke, Vertigo, Train yard tunnels). */
  levels?: MapLevel;
  sites: { A: { x: number; y: number }; B: { x: number; y: number } };
}

/** World-space bombsite centre points (approximate plant-zone centroids). */
export const MAP_CONFIGS: Record<string, MapConfig> = {
  de_mirage: {
    pos_x: -3230,
    pos_y: 1713,
    scale: 5.0,
    sites: { A: { x: -350, y: -1600 }, B: { x: -2100, y: 500 } }
  },
  de_dust2: {
    pos_x: -2476,
    pos_y: 3239,
    scale: 4.4,
    sites: { A: { x: 1100, y: 2400 }, B: { x: -1600, y: 2600 } }
  },
  de_inferno: {
    pos_x: -2087,
    pos_y: 3870,
    scale: 4.9,
    sites: { A: { x: 2000, y: 500 }, B: { x: 500, y: 2800 } }
  },
  de_nuke: {
    pos_x: -3453,
    pos_y: 2887,
    scale: 7.0,
    levels: { splitZ: -495 },
    sites: { A: { x: 700, y: -800 }, B: { x: 700, y: -1100 } }
  },
  de_overpass: {
    pos_x: -4831,
    pos_y: 1781,
    scale: 5.2,
    sites: { A: { x: -1470, y: 500 }, B: { x: -2300, y: 1200 } }
  },
  de_ancient: {
    pos_x: -2953,
    pos_y: 2164,
    scale: 5.0,
    sites: { A: { x: -1700, y: 1200 }, B: { x: -300, y: -1500 } }
  },
  de_anubis: {
    pos_x: -2796,
    pos_y: 3328,
    scale: 5.22,
    sites: { A: { x: 1500, y: 1200 }, B: { x: -1200, y: 1200 } }
  },
  de_vertigo: {
    pos_x: -3168,
    pos_y: 1762,
    scale: 4.0,
    levels: { splitZ: 11700 },
    sites: { A: { x: -600, y: -1400 }, B: { x: -2000, y: 400 } }
  },
  de_train: {
    pos_x: -2308,
    pos_y: 2078,
    scale: 4.082,
    sites: { A: { x: 500, y: -200 }, B: { x: 200, y: -1200 } }
  }
};

const FALLBACK: MapConfig = {
  pos_x: -4000,
  pos_y: 4000,
  scale: 8,
  sites: { A: { x: 1500, y: 1500 }, B: { x: -1500, y: -1500 } }
};

export function mapConfig(mapName: string): MapConfig {
  // GSI reports e.g. "de_mirage" or workshop paths like "workshop/123/de_mirage".
  const short = mapName.split('/').pop() ?? mapName;
  return MAP_CONFIGS[short] ?? FALLBACK;
}

export function displayMapName(mapName: string): string {
  const short = (mapName.split('/').pop() ?? mapName).replace(/^(de|cs)_/, '');
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** Projects a world position onto the 0-1024 radar plane. */
export function toRadar(cfg: MapConfig, pos: number[]): { x: number; y: number } {
  return {
    x: (pos[0] - cfg.pos_x) / cfg.scale,
    y: (cfg.pos_y - pos[1]) / cfg.scale
  };
}
