import { memo, useState } from 'react';
import styles from './Avatar.module.css';
import { playerAvatarUrl } from '@/services/lhmApi';
import { cn } from '@/utils/cn';

export interface AvatarProps {
  steamid: string;
  /** explicit avatar URL from LHM data; falls back to the LHM avatar route */
  url?: string;
  name: string;
  size?: number;
  dead?: boolean;
  className?: string;
}

/** Steam/LHM avatar with monogram fallback and dead-state desaturation. */
export const Avatar = memo(({ steamid, url, name, size = 36, dead, className }: AvatarProps) => {
  const [failed, setFailed] = useState(false);
  const src = url || playerAvatarUrl(steamid);
  return (
    <div
      className={cn(styles.wrap, dead && styles.dead, className)}
      style={{ width: size, height: size }}
    >
      {!failed ? (
        <img className={styles.img} src={src} alt={name} onError={() => setFailed(true)} />
      ) : (
        <div className={styles.fallback} style={{ fontSize: size * 0.42 }}>
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
});
Avatar.displayName = 'Avatar';
