import { memo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './HeadToHead.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Avatar } from '@/components/shared/Avatar';
import { useGSI } from '@/contexts/GSIContext';
import { useOverlays } from '@/contexts/ConfigContext';
import { matchMVP } from '@/utils/stats';
import { overlayCurtain } from '@/animations/variants';
import { cn } from '@/utils/cn';
import type { Player } from '@/types/hud';

interface StatSpec {
  label: string;
  value: (p: Player) => number;
  format?: (v: number) => string;
}

const STATS: StatSpec[] = [
  { label: 'RATING', value: (p) => p.computed.rating, format: (v) => v.toFixed(2) },
  { label: 'KILLS', value: (p) => p.stats.kills },
  { label: 'ADR', value: (p) => p.computed.adr, format: (v) => String(Math.round(v)) },
  { label: 'KAST', value: (p) => p.computed.kast, format: (v) => `${Math.round(v * 100)}%` },
  { label: 'HS %', value: (p) => p.computed.headshotPct, format: (v) => `${Math.round(v * 100)}%` },
  { label: 'OPENING KILLS', value: (p) => p.computed.openingKills },
  { label: 'UTILITY DMG', value: (p) => p.computed.utilityDamage, format: (v) => String(Math.round(v)) },
  { label: 'CLUTCHES WON', value: (p) => p.computed.clutchWins },
];

/**
 * Head-to-head comparison of each team's current top-rated player,
 * with mirrored stat meters. Toggled with Alt+H.
 */
export const HeadToHead = memo(() => {
  const overlays = useOverlays();
  const { left, right } = useGSI();

  const starLeft = matchMVP(left.players);
  const starRight = matchMVP(right.players);

  const vars = {
    '--left-color': left.side === 'CT' ? 'var(--ct)' : 'var(--t)',
    '--right-color': right.side === 'CT' ? 'var(--ct)' : 'var(--t)',
  } as CSSProperties;

  return (
    <AnimatePresence>
      {overlays.headToHead && starLeft && starRight && (
        <motion.div
          className={styles.backdrop}
          style={vars}
          variants={overlayCurtain}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={styles.title}>Head to head</div>
          <GlassPanel className={styles.card}>
            <div className={styles.playersRow}>
              <div className={styles.playerId}>
                <Avatar steamid={starLeft.steamid} url={starLeft.avatar} name={starLeft.name} size={56} />
                <div>
                  <div className={styles.playerNick}>{starLeft.name}</div>
                  <div className={styles.playerTeam}>{left.name}</div>
                </div>
              </div>
              <span className={styles.vsBadge}>VS</span>
              <div className={cn(styles.playerId, styles.playerIdRight)}>
                <Avatar steamid={starRight.steamid} url={starRight.avatar} name={starRight.name} size={56} />
                <div>
                  <div className={styles.playerNick}>{starRight.name}</div>
                  <div className={styles.playerTeam}>{right.name}</div>
                </div>
              </div>
            </div>

            {STATS.map((spec) => {
              const l = spec.value(starLeft);
              const r = spec.value(starRight);
              const max = Math.max(l, r, 0.0001);
              const fmt = spec.format ?? ((v: number) => String(Math.round(v)));
              return (
                <div key={spec.label} className={styles.statRow}>
                  <span className={cn(styles.statValue, styles.statValueLeft, l >= r && styles.leading)}>
                    {fmt(l)}
                  </span>
                  <div className={cn(styles.meter, styles.meterLeft)}>
                    <div className={styles.meterFill} style={{ width: `${(l / max) * 100}%` }} />
                  </div>
                  <span className={styles.statLabel}>{spec.label}</span>
                  <div className={cn(styles.meter, styles.meterRight)}>
                    <div className={styles.meterFill} style={{ width: `${(r / max) * 100}%` }} />
                  </div>
                  <span className={cn(styles.statValue, r >= l && styles.leading)}>{fmt(r)}</span>
                </div>
              );
            })}
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
HeadToHead.displayName = 'HeadToHead';
