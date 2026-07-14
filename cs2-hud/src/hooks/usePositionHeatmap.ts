import { useEffect, useRef, useState } from 'react';
import { engine } from '@/services/engine';
import { mapConfig, worldToRadar } from '@/utils/maps';
import type { Side } from '@/types/gsi';

const GRID = 28; // heatmap resolution per axis
const SAMPLE_MS = 1000;

export interface HeatCell {
  u: number; // 0..1 radar space
  v: number;
  weight: number; // 0..1 relative density
  side: Side;
}

/**
 * Records every living player's radar-space position once per second
 * for the whole map and reduces it to a density grid per side —
 * enough for a genuine broadcast heatmap without demo parsing.
 */
export const usePositionHeatmap = (): HeatCell[] => {
  const counts = useRef(new Map<string, { count: number; side: Side }>());
  const lastSample = useRef(0);
  const mapName = useRef('');
  const [cells, setCells] = useState<HeatCell[]>([]);

  useEffect(
    () =>
      engine.on('state', (state) => {
        if (state.match.mapName !== mapName.current) {
          mapName.current = state.match.mapName;
          counts.current.clear();
          setCells([]);
        }
        const now = Date.now();
        if (now - lastSample.current < SAMPLE_MS) return;
        lastSample.current = now;

        const cfg = mapConfig(state.match.mapName);
        if (!cfg || state.match.roundPhase !== 'live') return;

        for (const p of state.players) {
          if (!p.alive) continue;
          const { u, v } = worldToRadar(cfg, p.position);
          if (u < 0 || u > 1 || v < 0 || v > 1) continue;
          const gx = Math.floor(u * GRID);
          const gy = Math.floor(v * GRID);
          const key = `${gx},${gy},${p.side}`;
          const entry = counts.current.get(key);
          if (entry) entry.count += 1;
          else counts.current.set(key, { count: 1, side: p.side });
        }

        let max = 1;
        for (const e of counts.current.values()) max = Math.max(max, e.count);
        setCells(
          [...counts.current.entries()].map(([key, e]) => {
            const [gx, gy] = key.split(',').map(Number);
            return {
              u: (gx + 0.5) / GRID,
              v: (gy + 0.5) / GRID,
              weight: e.count / max,
              side: e.side,
            };
          }),
        );
      }),
    [],
  );

  return cells;
};
