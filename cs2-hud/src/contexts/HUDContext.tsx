import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CSGO, Player, Team } from 'csgogsi';
import { connectSocket, GSI, onMatchUpdate } from '../services/socket';
import { isDemoMode, startDemo } from '../services/demo';
import { api } from '../services/api';
import type { MatchData } from '../types/match';
import { sortByObserverSlot } from '../utils/players';

export interface HUDState {
  game: CSGO | null;
  match: MatchData | null;
  /** Teams keyed by screen side; left = the team LHM assigned to the left slot. */
  leftTeam: Team | null;
  rightTeam: Team | null;
  leftPlayers: Player[];
  rightPlayers: Player[];
  observed: Player | null;
}

const HUDContext = createContext<HUDState>({
  game: null,
  match: null,
  leftTeam: null,
  rightTeam: null,
  leftPlayers: [],
  rightPlayers: [],
  observed: null
});

export function useHUD(): HUDState {
  return useContext(HUDContext);
}

export function HUDProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<CSGO | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);

  useEffect(() => {
    // Demo mode replaces the live socket with a synthetic GSI feed so the HUD
    // can be designed and staged without a running game.
    if (isDemoMode()) {
      startDemo();
    } else {
      connectSocket();
    }
    const onData = (data: CSGO) => setGame(data);
    GSI.on('data', onData);

    const loadMatch = () => {
      api.match.getCurrent().then(setMatch).catch(() => undefined);
    };
    loadMatch();
    const offMatch = onMatchUpdate(loadMatch);

    return () => {
      GSI.off('data', onData);
      offMatch();
    };
  }, []);

  const value = useMemo<HUDState>(() => {
    if (!game) {
      return {
        game: null,
        match,
        leftTeam: null,
        rightTeam: null,
        leftPlayers: [],
        rightPlayers: [],
        observed: null
      };
    }
    // csgogsi assigns Team.orientation from the LHM match slots, so the HUD
    // never flips visually when sides swap at halftime.
    const ctOnLeft = game.map.team_ct.orientation === 'left';
    const leftTeam = ctOnLeft ? game.map.team_ct : game.map.team_t;
    const rightTeam = ctOnLeft ? game.map.team_t : game.map.team_ct;
    const leftPlayers = sortByObserverSlot(game.players.filter(p => p.team.side === leftTeam.side));
    const rightPlayers = sortByObserverSlot(game.players.filter(p => p.team.side === rightTeam.side));
    return {
      game,
      match,
      leftTeam,
      rightTeam,
      leftPlayers,
      rightPlayers,
      observed: game.player
    };
  }, [game, match]);

  return <HUDContext.Provider value={value}>{children}</HUDContext.Provider>;
}
