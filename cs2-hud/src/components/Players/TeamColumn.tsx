import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Player, Team } from 'csgogsi';
import { PlayerCard } from './PlayerCard';
import { staggerChildren } from '../../animations';
import styles from './Players.module.css';

interface Props {
  team: Team | null;
  players: Player[];
  side: 'left' | 'right';
}

/** Vertical stack of five player cards anchored to one side of the frame. */
export const TeamColumn = memo(function TeamColumn({ team, players, side }: Props) {
  if (!team || players.length === 0) return null;
  return (
    <motion.div
      className={styles.column}
      data-side={side}
      variants={staggerChildren(0.05)}
      initial="hidden"
      animate="visible"
    >
      {players.map(player => (
        <PlayerCard key={player.steamid} player={player} align={side} />
      ))}
    </motion.div>
  );
});
