import { useEffect, useState } from 'react';
import { engine } from '@/services/engine';
import { fetchCurrentMatch, fetchPlayers } from '@/services/lhmApi';
import type { LHMMatch, LHMPlayer } from '@/types/hud';

/** LHM match record (veto, series) + player database, kept in sync. */
export const useMatchData = (): { match: LHMMatch | null; players: LHMPlayer[] } => {
  const [match, setMatch] = useState<LHMMatch | null>(null);
  const [players, setPlayers] = useState<LHMPlayer[]>([]);

  useEffect(() => {
    void fetchCurrentMatch().then(setMatch);
    void fetchPlayers().then(setPlayers);
    return engine.on('matchData', (m) => {
      setMatch(m);
      void fetchPlayers().then(setPlayers);
    });
  }, []);

  return { match, players };
};
