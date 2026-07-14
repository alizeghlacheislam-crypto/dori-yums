import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './CenterAlerts.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { BombIcon, DefuseKitIcon, TrophyIcon } from '@/assets/icons/Icons';
import { useGSI } from '@/contexts/GSIContext';
import { useEngineEvent } from '@/hooks/useEngineEvent';
import { scalePop } from '@/animations/variants';
import { cn } from '@/utils/cn';
import type { KillEvent } from '@/types/hud';

interface Alert {
  id: number;
  tone: 'danger' | 'success' | 'gold';
  text: string;
  sub?: string;
  icon?: 'bomb' | 'defuse' | 'trophy';
}

const ALERT_TTL_MS = 2600;
const BOMB_TIMER_S = 40;

let alertSeq = 0;

/**
 * Event-driven broadcast banners under the top bar: bomb lifecycle,
 * aces, ninja defuses and round results — plus the persistent clutch
 * chip and a bomb/defuse progress line while the bomb is live.
 */
export const CenterAlerts = memo(() => {
  const { bomb, clutch, players, left, right, match } = useGSI();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const timers = useRef<number[]>([]);

  const push = useCallback((alert: Omit<Alert, 'id'>) => {
    const id = ++alertSeq;
    setAlerts((list) => [...list.slice(-1), { ...alert, id }]);
    timers.current.push(
      window.setTimeout(() => setAlerts((list) => list.filter((a) => a.id !== id)), ALERT_TTL_MS),
    );
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEngineEvent(
    'bombPlant',
    useCallback(
      (planter: string | undefined) => {
        const name = players.find((p) => p.steamid === planter)?.name;
        push({
          tone: 'danger',
          icon: 'bomb',
          text: 'Bomb planted',
          sub: name ? `PLANTED BY ${name.toUpperCase()}` : undefined,
        });
      },
      [players, push],
    ),
  );

  useEngineEvent(
    'bombDefused',
    useCallback(() => {
      // Ninja defuse: the bomb died while two or more attackers still stood.
      const tAlive = players.filter((p) => p.side === 'T' && p.alive).length;
      push({
        tone: 'success',
        icon: 'defuse',
        text: tAlive >= 2 ? 'Ninja defuse' : 'Bomb defused',
      });
    }, [players, push]),
  );

  useEngineEvent(
    'bombExploded',
    useCallback(() => push({ tone: 'danger', icon: 'bomb', text: 'Bomb detonated' }), [push]),
  );

  useEngineEvent(
    'kill',
    useCallback(
      (kill: KillEvent) => {
        if (kill.multiKillIndex === 5 && kill.attacker) {
          push({ tone: 'gold', icon: 'trophy', text: `${kill.attacker.name} ACE`, sub: '5 KILLS' });
        }
      },
      [push],
    ),
  );

  useEngineEvent(
    'roundEnd',
    useCallback(
      ({ winner }: { winner: 'CT' | 'T'; round: number }) => {
        const team = left.side === winner ? left : right;
        push({
          tone: winner === 'CT' ? 'success' : 'danger',
          text: `${team.name} win the round`,
        });
      },
      [left, right, push],
    ),
  );

  const clutcher = clutch ? players.find((p) => p.steamid === clutch.steamid) : undefined;
  const bombLive = bomb?.state === 'planted' || bomb?.state === 'defusing';

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div key={alert.id} variants={scalePop} initial="hidden" animate="visible" exit="exit">
            <GlassPanel
              className={cn(
                styles.banner,
                alert.tone === 'danger' && styles.bannerDanger,
                alert.tone === 'success' && styles.bannerSuccess,
                alert.tone === 'gold' && styles.bannerGold,
              )}
            >
              {alert.icon === 'bomb' && <BombIcon size={16} />}
              {alert.icon === 'defuse' && <DefuseKitIcon size={16} />}
              {alert.icon === 'trophy' && <TrophyIcon size={16} />}
              <span>
                {alert.text}
                {alert.sub && <div className={styles.sub}>{alert.sub}</div>}
              </span>
            </GlassPanel>
          </motion.div>
        ))}

        {clutcher && clutcher.alive && !match.isFreezetime && (
          <motion.div key="clutch" variants={scalePop} initial="hidden" animate="visible" exit="exit">
            <GlassPanel className={styles.clutchChip}>
              <span className={styles.clutchCount}>1v{clutch!.opponents}</span>
              <span>{clutcher.name} in the clutch</span>
            </GlassPanel>
          </motion.div>
        )}

        {bombLive && (
          <motion.div
            key="bombbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.bombProgress}>
              <div
                className={cn(styles.bombFill, bomb?.state === 'defusing' && styles.defuseFill)}
                style={{ width: `${Math.min(100, ((bomb?.countdown ?? 0) / BOMB_TIMER_S) * 100)}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
CenterAlerts.displayName = 'CenterAlerts';
