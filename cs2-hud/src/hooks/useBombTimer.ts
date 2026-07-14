import { useEffect, useRef, useState } from 'react';
import { GSI } from '../services/socket';
import type { Player } from 'csgogsi';

export interface BombState {
  planted: boolean;
  /** Seconds until detonation, interpolated between GSI ticks for 60fps smoothness. */
  timeLeft: number;
  site: 'A' | 'B' | null;
  planting: Player | null;
  defusing: Player | null;
  /** 0-1 progress of an ongoing defuse (10s without kit, 5s with kit). */
  defuseProgress: number;
  defuseTime: number;
  /** True when the defuse would finish after detonation — the caster moment. */
  defuseTooLate: boolean;
  exploded: boolean;
  defused: boolean;
}

const BOMB_TIME = 40;

const IDLE: BombState = {
  planted: false,
  timeLeft: BOMB_TIME,
  site: null,
  planting: null,
  defusing: null,
  defuseProgress: 0,
  defuseTime: 10,
  defuseTooLate: false,
  exploded: false,
  defused: false
};

/**
 * Bomb clock driven by GSI countdowns but interpolated with
 * requestAnimationFrame so progress bars sweep smoothly at 60fps.
 */
export function useBombTimer(): BombState {
  const [state, setState] = useState<BombState>(IDLE);
  const anchor = useRef({ countdown: BOMB_TIME, at: 0, defuseCountdown: 0, defuseAt: 0 });

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const game = GSI.current;
      const bomb = game?.bomb ?? null;
      if (!bomb || !game) {
        setState(prev => (prev === IDLE ? prev : IDLE));
        raf = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      // While the bomb is DEFUSING, GSI repurposes bomb.countdown as the
      // defuse countdown — so each countdown value anchors its own clock and
      // the detonation timer keeps free-running from its last known anchor.
      if (typeof bomb.countdown === 'number') {
        if (bomb.state === 'planted' && Math.abs(bomb.countdown - anchor.current.countdown) > 0.01) {
          anchor.current.countdown = bomb.countdown;
          anchor.current.at = now;
        }
        if (bomb.state === 'defusing' && Math.abs(bomb.countdown - anchor.current.defuseCountdown) > 0.01) {
          anchor.current.defuseCountdown = bomb.countdown;
          anchor.current.defuseAt = now;
        }
      }
      if (bomb.state === 'carried' || bomb.state === 'dropped' || bomb.state === 'planting') {
        anchor.current.countdown = BOMB_TIME;
        anchor.current.at = now;
      }

      const planted = bomb.state === 'planted' || bomb.state === 'defusing';
      const timeLeft = planted
        ? Math.max(0, anchor.current.countdown - (now - anchor.current.at) / 1000)
        : BOMB_TIME;

      let defuseProgress = 0;
      let defuseTime = 10;
      let defuseTooLate = false;
      if (bomb.state === 'defusing' && bomb.player) {
        defuseTime = bomb.player.state.defusekit ? 5 : 10;
        const defuseLeft = Math.max(0, anchor.current.defuseCountdown - (now - anchor.current.defuseAt) / 1000);
        defuseProgress = Math.min(1, Math.max(0, 1 - defuseLeft / defuseTime));
        // The dramatic "not enough time" read: defuse finishes after the boom.
        defuseTooLate = defuseLeft > timeLeft;
      }

      setState({
        planted,
        timeLeft,
        site: bomb.site,
        planting: bomb.state === 'planting' ? (bomb.player ?? null) : null,
        defusing: bomb.state === 'defusing' ? (bomb.player ?? null) : null,
        defuseProgress,
        defuseTime,
        defuseTooLate,
        exploded: bomb.state === 'exploded',
        defused: bomb.state === 'defused'
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return state;
}
