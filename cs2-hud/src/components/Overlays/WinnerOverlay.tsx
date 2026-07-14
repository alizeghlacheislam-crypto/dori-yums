import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Score } from 'csgogsi';
import styles from './Overlays.module.css';
import { GSI } from '../../services/socket';
import { actions } from '../../services/actions';
import { fade, popIn } from '../../animations';
import { TeamLogo } from '../shared/TeamLogo';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  size: number;
}

/**
 * Confetti built from staggered CSS-animated pieces. Each individual piece
 * animates on the GPU; the field as a whole persists while the overlay is up.
 */
function ConfettiField() {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    const colors = ['#E63946', '#2EC4B6', '#FFD166', '#FFFFFF'];
    return Array.from({ length: 90 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2.4,
      duration: 2.6 + Math.random() * 1.8,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 7
    }));
  }, []);

  return (
    <div className={styles.confetti} aria-hidden>
      {pieces.map(p => (
        <span
          key={p.id}
          className={styles.confettiPiece}
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  );
}

/**
 * Map / match winner takeover. Fires automatically on GSI matchEnd and can be
 * re-shown or dismissed with the Alt+W keybind.
 */
export function WinnerOverlay() {
  const [score, setScore] = useState<Score | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onEnd = (s: Score) => {
      setScore(s);
      setVisible(true);
    };
    GSI.on('matchEnd', onEnd);
    const offToggle = actions.on('toggleWinner', () => setVisible(v => !v));
    return () => {
      GSI.off('matchEnd', onEnd);
      offToggle();
    };
  }, []);

  const seriesOver = score
    ? score.winner.matches_won_this_series + 1 >= Math.max(1, score.map.num_matches_to_win_series)
    : false;

  return (
    <AnimatePresence>
      {visible && score && (
        <motion.div className={`zone-overlay ${styles.winnerRoot}`} variants={fade} initial="hidden" animate="visible" exit="exit">
          <ConfettiField />
          <motion.div className={styles.winnerCard} data-side={score.winner.side} variants={popIn} initial="hidden" animate="visible" exit="exit">
            <span className={styles.winnerKicker}>{seriesOver ? 'SERIES WINNER' : 'MAP WINNER'}</span>
            <TeamLogo team={score.winner} size={110} />
            <span className={styles.winnerName}>{score.winner.name}</span>
            <span className={`${styles.winnerScore} mono`}>
              {score.winner.score} : {score.loser.score}
            </span>
            <span className={styles.winnerSub}>
              {seriesOver
                ? 'CHAMPIONS'
                : `LEADS THE SERIES ${score.winner.matches_won_this_series + 1} - ${score.loser.matches_won_this_series}`}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
