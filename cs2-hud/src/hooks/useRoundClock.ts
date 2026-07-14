import { useEffect, useRef, useState } from 'react';
import { GSI } from '../services/socket';

/** GSI phase_countdowns phases (csgogsi keeps this type internal). */
export type GamePhase =
  | 'freezetime'
  | 'bomb'
  | 'warmup'
  | 'live'
  | 'over'
  | 'defuse'
  | 'paused'
  | 'timeout_ct'
  | 'timeout_t'
  | undefined;

export interface RoundClock {
  phase: GamePhase;
  /** Smoothly interpolated seconds remaining in the current phase. */
  timeLeft: number;
  paused: boolean;
  timeout: 'CT' | 'T' | null;
  timeoutTeamName: string | null;
  freezetime: boolean;
  warmup: boolean;
  live: boolean;
  over: boolean;
}

/**
 * Round/freezetime clock. GSI only ticks a few times per second, so the value
 * is anchored on each update and interpolated with rAF between ticks.
 */
export function useRoundClock(): RoundClock {
  const [state, setState] = useState<RoundClock>({
    phase: 'warmup',
    timeLeft: 0,
    paused: false,
    timeout: null,
    timeoutTeamName: null,
    freezetime: false,
    warmup: true,
    live: false,
    over: false
  });
  const anchor = useRef({ ends: 0, at: 0, phase: '' as string | undefined });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const game = GSI.current;
      const pc = game?.phase_countdowns;
      if (!pc) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const now = performance.now();
      const phase = pc.phase;
      const ends = pc.phase_ends_in;
      if (phase !== anchor.current.phase || Math.abs(ends - anchor.current.ends) > 0.4) {
        anchor.current = { ends, at: now, phase };
      }

      const paused = phase === 'paused';
      const timeout = phase === 'timeout_ct' ? 'CT' : phase === 'timeout_t' ? 'T' : null;
      // Clocks freeze during pauses/timeouts; otherwise interpolate.
      const timeLeft = paused
        ? anchor.current.ends
        : Math.max(0, anchor.current.ends - (now - anchor.current.at) / 1000);

      const timeoutTeamName = timeout
        ? (timeout === 'CT' ? game.map.team_ct.name : game.map.team_t.name)
        : null;

      setState(prev => {
        const next: RoundClock = {
          phase,
          timeLeft,
          paused,
          timeout,
          timeoutTeamName,
          freezetime: phase === 'freezetime',
          warmup: phase === 'warmup',
          live: phase === 'live',
          over: phase === 'over'
        };
        // Avoid a state churn when nothing visible changed (dead phases).
        if (
          prev.phase === next.phase &&
          Math.abs(prev.timeLeft - next.timeLeft) < 0.03 &&
          prev.paused === next.paused &&
          prev.timeout === next.timeout
        ) {
          return prev;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return state;
}
