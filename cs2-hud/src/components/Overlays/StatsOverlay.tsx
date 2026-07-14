import { memo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './StatsOverlay.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { WeaponIcon } from '@/assets/weapons/WeaponIcon';
import { useGSI } from '@/contexts/GSIContext';
import { useOverlays } from '@/contexts/ConfigContext';
import { usePositionHeatmap } from '@/hooks/usePositionHeatmap';
import { mapDisplayName } from '@/utils/maps';
import { byRating } from '@/utils/stats';
import { overlayCurtain } from '@/animations/variants';
import { weaponMeta } from '@/utils/weapons';
import type { Player, TeamInfo } from '@/types/hud';

/**
 * Full statistics board (Alt+S): per-player advanced table for both
 * teams, most-used weapons, and a live positional heatmap built from
 * sampled radar positions.
 */
export const StatsOverlay = memo(() => {
  const overlays = useOverlays();
  const { left, right, match } = useGSI();
  const heat = usePositionHeatmap();

  return (
    <AnimatePresence>
      {overlays.stats && (
        <motion.div
          className={styles.backdrop}
          variants={overlayCurtain}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={styles.title}>Match statistics</div>
          <div className={styles.columns}>
            <div className={styles.side}>
              <TeamTable team={left} />
              <TeamTable team={right} />
            </div>
            <div className={styles.side}>
              <GlassPanel className={styles.panelCard}>
                <span className={styles.panelTitle}>
                  Position heatmap · {mapDisplayName(match.mapName)}
                </span>
                <div className={styles.heatStage}>
                  <svg viewBox="0 0 100 100" width={250} height={250} style={{ display: 'block' }}>
                    {heat.map((cell, i) => (
                      <circle
                        key={i}
                        cx={cell.u * 100}
                        cy={cell.v * 100}
                        r={2 + cell.weight * 3.5}
                        fill={cell.side === 'CT' ? 'var(--ct)' : 'var(--t)'}
                        opacity={0.14 + cell.weight * 0.5}
                      />
                    ))}
                  </svg>
                </div>
              </GlassPanel>
              <WeaponUsage players={[...left.players, ...right.players]} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
StatsOverlay.displayName = 'StatsOverlay';

/* ------------------------------------------------------------------ */

const pct = (v: number) => `${Math.round(v * 100)}%`;

const TeamTable = memo(({ team }: { team: TeamInfo }) => {
  const players = [...team.players].sort(byRating);
  const best = (fn: (p: Player) => number): number => Math.max(...players.map(fn), 0);
  const bAdr = best((p) => p.computed.adr);
  const bRating = best((p) => p.computed.rating);

  const tradePct = (p: Player) =>
    p.stats.kills > 0 ? p.computed.tradeKills / p.stats.kills : 0;
  const entryPct = (p: Player) =>
    p.computed.entryAttempts > 0 ? p.computed.entryWins / p.computed.entryAttempts : 0;
  const clutchPct = (p: Player) =>
    p.computed.clutchAttempts > 0 ? p.computed.clutchWins / p.computed.clutchAttempts : 0;

  return (
    <GlassPanel
      className={styles.tableCard}
      style={{ '--side-color': team.side === 'CT' ? 'var(--ct)' : 'var(--t)' } as CSSProperties}
    >
      <span className={styles.teamLabel}>
        <TeamLogo logo={team.logo} name={team.name} shortName={team.shortName} size={20} />
        {team.name}
      </span>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>PLAYER</th>
            <th>K</th>
            <th>A</th>
            <th>D</th>
            <th>ADR</th>
            <th>KAST</th>
            <th>RTG</th>
            <th>HS%</th>
            <th>UD</th>
            <th>FA</th>
            <th>ENTRY</th>
            <th>OPEN</th>
            <th>TRADE%</th>
            <th>CLUTCH</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.steamid}>
              <td>{p.name}</td>
              <td>{p.stats.kills}</td>
              <td>{p.stats.assists}</td>
              <td>{p.stats.deaths}</td>
              <td className={p.computed.adr === bAdr ? styles.best : ''}>
                {Math.round(p.computed.adr)}
              </td>
              <td>{pct(p.computed.kast)}</td>
              <td className={p.computed.rating === bRating ? styles.best : ''}>
                {p.computed.rating.toFixed(2)}
              </td>
              <td>{pct(p.computed.headshotPct)}</td>
              <td>{Math.round(p.computed.utilityDamage)}</td>
              <td>{p.computed.flashAssists}</td>
              <td>
                {p.computed.entryWins}/{p.computed.entryAttempts} ({pct(entryPct(p))})
              </td>
              <td>
                {p.computed.openingKills}–{p.computed.openingDeaths}
              </td>
              <td>{pct(tradePct(p))}</td>
              <td>
                {p.computed.clutchWins}/{p.computed.clutchAttempts} ({pct(clutchPct(p))})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassPanel>
  );
});
TeamTable.displayName = 'TeamTable';

/* ------------------------------------------------------------------ */

const WeaponUsage = memo(({ players }: { players: Player[] }) => {
  const totals = new Map<string, number>();
  for (const p of players) {
    for (const [weapon, kills] of Object.entries(p.computed.weaponKills)) {
      totals.set(weapon, (totals.get(weapon) ?? 0) + kills);
    }
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (top.length === 0) return null;

  return (
    <GlassPanel className={styles.panelCard}>
      <span className={styles.panelTitle}>Kills by weapon</span>
      {top.map(([weapon, kills]) => (
        <div key={weapon} className={styles.weaponRow}>
          <WeaponIcon weaponId={weapon} size={15} />
          <span>{weaponMeta(weapon).displayName}</span>
          <b>{kills}</b>
        </div>
      ))}
    </GlassPanel>
  );
});
WeaponUsage.displayName = 'WeaponUsage';
