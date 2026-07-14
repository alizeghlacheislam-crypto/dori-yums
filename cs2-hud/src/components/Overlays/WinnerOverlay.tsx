import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './WinnerOverlay.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { Avatar } from '@/components/shared/Avatar';
import { TrophyIcon } from '@/assets/icons/Icons';
import { useGSI } from '@/contexts/GSIContext';
import { matchMVP } from '@/utils/stats';
import { overlayCurtain, scalePop } from '@/animations/variants';

const CONFETTI_COLORS = ['#E63946', '#2EC4B6', '#FFD166', '#4DA3FF', '#FFFFFF'];
const CONFETTI_COUNT = 90;

interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  color: string;
}

const Confetti = memo(() => {
  // Randomized once per mount — pieces keep falling while the overlay is up.
  const pieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.4,
        duration: 2.2 + Math.random() * 1.8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      })),
    [],
  );
  return (
    <div className={styles.confetti}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={styles.piece}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  );
});
Confetti.displayName = 'Confetti';

/**
 * Map-end celebration: appears automatically when GSI reports the map
 * `gameover` phase — winner name, final scoreline, confetti and the
 * map MVP by live rating.
 */
export const WinnerOverlay = memo(() => {
  const { match, left, right, players } = useGSI();

  const over = match.mapPhase === 'gameover';
  const winner = left.score > right.score ? left : right;
  const mvp = matchMVP(players);

  return (
    <AnimatePresence>
      {over && (
        <motion.div
          className={styles.backdrop}
          variants={overlayCurtain}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Confetti />
          <motion.div variants={scalePop} initial="hidden" animate="visible">
            <TrophyIcon size={64} className={styles.trophy} />
          </motion.div>
          <span className={styles.winnerLabel}>Map winners</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <TeamLogo logo={winner.logo} name={winner.name} shortName={winner.shortName} size={72} />
            <span className={styles.winnerName}>{winner.name}</span>
          </div>
          <span className={styles.scoreline}>
            {left.score} — {right.score}
          </span>

          {mvp && (
            <motion.div variants={scalePop} initial="hidden" animate="visible">
              <GlassPanel className={styles.mvpCard} accent="left" accentColor="var(--accent)">
                <Avatar steamid={mvp.steamid} url={mvp.avatar} name={mvp.name} size={52} />
                <div>
                  <div className={styles.mvpLabel}>MAP MVP</div>
                  <div className={styles.mvpNick}>{mvp.name}</div>
                  <div className={styles.mvpStats}>
                    {mvp.stats.kills}–{mvp.stats.deaths} · {Math.round(mvp.computed.adr)} ADR ·{' '}
                    {mvp.computed.rating.toFixed(2)} RTG
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
WinnerOverlay.displayName = 'WinnerOverlay';
