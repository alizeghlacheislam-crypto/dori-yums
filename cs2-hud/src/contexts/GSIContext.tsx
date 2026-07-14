import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { engine } from '@/services/engine';
import type { HUDState, TeamInfo } from '@/types/hud';

const emptyTeam = (orientation: 'left' | 'right'): TeamInfo => ({
  name: orientation === 'left' ? 'Team A' : 'Team B',
  shortName: orientation === 'left' ? 'TMA' : 'TMB',
  side: orientation === 'left' ? 'CT' : 'T',
  orientation,
  score: 0,
  seriesScore: 0,
  consecutiveLosses: 0,
  timeoutsRemaining: 1,
  players: [],
  aliveCount: 0,
  totalMoney: 0,
  totalEquipValue: 0,
  lossBonus: 1400,
});

export const emptyHUDState: HUDState = {
  connected: false,
  left: emptyTeam('left'),
  right: emptyTeam('right'),
  players: [],
  match: {
    mapName: '',
    mapPhase: 'warmup',
    roundNumber: 1,
    roundPhase: 'freezetime',
    phase: 'warmup',
    phaseEndsIn: 0,
    isPaused: false,
    isFreezetime: true,
    isWarmup: true,
    isOvertime: false,
    bestOf: 1,
    roundWins: [],
  },
  grenades: [],
  winProbabilityLeft: 0.5,
  frameTimestamp: 0,
};

const GSIContext = createContext<HUDState>(emptyHUDState);

export const GSIProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<HUDState>(engine.state ?? emptyHUDState);

  useEffect(() => {
    engine.start();
    return engine.on('state', setState);
  }, []);

  return <GSIContext.Provider value={state}>{children}</GSIContext.Provider>;
};

export const useGSI = (): HUDState => useContext(GSIContext);
