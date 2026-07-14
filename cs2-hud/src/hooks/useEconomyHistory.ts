import { useEffect, useRef, useState } from 'react';
import { engine } from '@/services/engine';
import type { HUDState } from '@/types/hud';
import { classifyBuy, type BuyTier } from '@/utils/economy';

export interface EconomyRound {
  round: number;
  leftEquip: number;
  rightEquip: number;
  leftBuy: BuyTier;
  rightBuy: BuyTier;
}

/**
 * Samples both teams' equipment value at the moment each round goes
 * live (end of buy time) — the series the economy graph plots.
 */
export const useEconomyHistory = (): EconomyRound[] => {
  const [history, setHistory] = useState<EconomyRound[]>([]);
  const prevPhase = useRef<string>('');
  const mapName = useRef<string>('');

  useEffect(
    () =>
      engine.on('state', (state: HUDState) => {
        if (state.match.mapName !== mapName.current) {
          mapName.current = state.match.mapName;
          setHistory([]);
        }
        const phase = state.match.roundPhase;
        if (prevPhase.current === 'freezetime' && phase === 'live') {
          const round = state.match.roundNumber;
          setHistory((h) => {
            if (h.some((e) => e.round === round)) return h;
            return [
              ...h.slice(-29),
              {
                round,
                leftEquip: state.left.totalEquipValue,
                rightEquip: state.right.totalEquipValue,
                leftBuy: classifyBuy(state.left.players, round),
                rightBuy: classifyBuy(state.right.players, round),
              },
            ];
          });
        }
        prevPhase.current = phase;
      }),
    [],
  );

  return history;
};
