import { memo, useState } from 'react';
import styles from './TeamLogo.module.css';

export interface TeamLogoProps {
  logo?: string;
  name: string;
  shortName: string;
  size?: number;
  className?: string;
}

/** Team logo with a monogram fallback when no image is configured. */
export const TeamLogo = memo(({ logo, name, shortName, size = 44, className }: TeamLogoProps) => {
  const [failed, setFailed] = useState(false);
  const showImage = logo && !failed;
  return (
    <div className={`${styles.wrap} ${className ?? ''}`} style={{ width: size, height: size }}>
      {showImage ? (
        <img className={styles.img} src={logo} alt={name} onError={() => setFailed(true)} />
      ) : (
        <div className={styles.fallback} style={{ fontSize: size * 0.34 }}>
          {shortName.slice(0, 3)}
        </div>
      )}
    </div>
  );
});
TeamLogo.displayName = 'TeamLogo';
