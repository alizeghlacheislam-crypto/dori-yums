import { memo, useState } from 'react';
import type { Team } from 'csgogsi';
import { resolveAsset } from '../../services/api';

interface Props {
  team: Team | null;
  size?: number;
  className?: string;
}

/**
 * Team logo with a monogram fallback so a missing upload never leaves a hole
 * in the broadcast frame.
 */
export const TeamLogo = memo(function TeamLogo({ team, size = 44, className }: Props) {
  const [failed, setFailed] = useState(false);
  const src = resolveAsset(team?.logo ?? null);
  const name = team?.name ?? 'TBD';

  if (!src || failed) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--glass)',
          border: '1px solid var(--border)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.4,
          letterSpacing: '0.02em',
          color: 'var(--text-dim)'
        }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  );
});
