import { memo } from 'react';
import { motion } from 'framer-motion';
import styles from './PlayerList.module.css';
import { PlayerCard } from './PlayerCard';
import { useGSI } from '@/contexts/GSIContext';
import { riseItem, staggerChildren } from '@/animations/variants';
import { cn } from '@/utils/cn';

export interface PlayerListProps {
  orientation: 'left' | 'right';
}

/** Five stacked player cards on one side of the screen. */
export const PlayerList = memo(({ orientation }: PlayerListProps) => {
  const { left, right, bomb } = useGSI();
  const team = orientation === 'left' ? left : right;

  return (
    <motion.div
      className={cn(styles.list, orientation === 'left' ? styles.left : styles.right)}
      variants={staggerChildren(0.05)}
      initial="hidden"
      animate="visible"
    >
      {team.players.map((player) => (
        <motion.div key={player.steamid} variants={riseItem} layout="position">
          <PlayerCard player={player} orientation={orientation} bombCountdown={bomb?.countdown} />
        </motion.div>
      ))}
    </motion.div>
  );
});
PlayerList.displayName = 'PlayerList';
