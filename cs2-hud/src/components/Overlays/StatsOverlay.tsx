import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from 'csgogsi';
import styles from './Overlays.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useAllStats } from '../../hooks/useMatchStats';
import { mapConfig, toRadar } from '../../utils/maps';
import { pct, ratio } from '../../utils/format';
import { overlay, slideUp, staggerChildren } from '../../animations';
import { TeamLogo } from '../shared/TeamLogo';
import type { DerivedPlayerStats } from '../../types/stats';

const COLUMNS: { key: string; label: string; value: (s: DerivedPlayerStats) => string; best?: (s: DerivedPlayerStats) => number }[] = [
  { key: 'k', label: 'K', value: s => String(s.kills), best: s => s.kills },
  { key: 'd', label: 'D', value: s => String(s.deaths) },
  { key: 'a', label: 'A', value: s => String(s.assists) },
  { key: 'adr', label: 'ADR', value: s => String(Math.round(s.adr)), best: s => s.adr },
  { key: 'kast', label: 'KAST', value: s => pct(s.kast), best: s => s.kast },
  { key: 'hs', label: 'HS%', value: s => pct(s.hsPercent), best: s => s.hsPercent },
  { key: 'ud', label: 'UTIL DMG', value: s => String(Math.round(s.utilityDamage)), best: s => s.utilityDamage },
  { key: 'fa', label: 'FLASH AST', value: s => String(s.flashAssists), best: s => s.flashAssists },
  { key: 'entry', label: 'ENTRY', value: s => `${s.openingKills}-${s.openingDeaths}`, best: s => s.openingSuccess },
  { key: 'trade', label: 'TRADE%', value: s => pct(s.tradePercent), best: s => s.tradePercent },
  { key: 'clutch', label: 'CLUTCH', value: s => `${s.clutchWins}/${s.clutchAttempts}`, best: s => s.clutchWins },
  { key: 'rating', label: 'RATING', value: s => ratio(s.rating), best: s => s.rating }
];

function KillHeatmap({ players, stats }: { players: Player[]; stats: DerivedPlayerStats[] }) {
  const { game } = useHUD();
  const cfg = useMemo(() => mapConfig(game?.map.name ?? ''), [game?.map.name]);
  const points = useMemo(() => {
    const bySteamid = new Map(players.map(p => [p.steamid, p.team.side]));
    return stats.flatMap(s =>
      s.killPositions.map((pos, i) => ({
        id: `${s.steamid}-${i}`,
        side: bySteamid.get(s.steamid) ?? null,
        ...toRadar(cfg, [pos.x, pos.y])
      }))
    );
  }, [players, stats, cfg]);

  return (
    <div className={styles.heatmap}>
      <span className={styles.heatmapTitle}>KILL HEATMAP</span>
      <svg viewBox="0 0 1024 1024" className={styles.heatmapSvg}>
        <rect width={1024} height={1024} fill="rgba(255,255,255,0.03)" rx={12} />
        {points.map(p => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={16}
            fill={p.side === 'CT' ? 'var(--ct)' : 'var(--t)'}
            opacity={0.28}
          />
        ))}
      </svg>
    </div>
  );
}

function TeamTable({ players, stats }: { players: Player[]; stats: DerivedPlayerStats[] }) {
  const rows = players.map(p => ({
    player: p,
    s: stats.find(s => s.steamid === p.steamid)
  }));
  const bests = new Map<string, number>();
  for (const col of COLUMNS) {
    if (!col.best) continue;
    bests.set(col.key, Math.max(0, ...rows.map(r => (r.s ? col.best!(r.s) : 0))));
  }

  return (
    <table className={styles.statsTable}>
      <thead>
        <tr>
          <th className={styles.statsPlayerCol}>PLAYER</th>
          {COLUMNS.map(c => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ player, s }) => (
          <tr key={player.steamid} data-side={player.team.side}>
            <td className={styles.statsPlayerCol}>{player.name}</td>
            {COLUMNS.map(c => {
              const isBest = Boolean(s && c.best && bests.get(c.key)! > 0 && Math.abs(c.best(s) - bests.get(c.key)!) < 1e-9);
              return (
                <td key={c.key} className="mono" data-best={isBest}>
                  {s ? c.value(s) : '—'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function WeaponUsage({ stats }: { stats: DerivedPlayerStats[] }) {
  const usage = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of stats) {
      for (const [weapon, kills] of Object.entries(s.weaponKills)) {
        totals.set(weapon, (totals.get(weapon) ?? 0) + kills);
      }
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [stats]);
  const max = Math.max(1, ...usage.map(([, k]) => k));

  if (usage.length === 0) return null;
  return (
    <div className={styles.weaponUsage}>
      <span className={styles.heatmapTitle}>KILLS BY WEAPON</span>
      {usage.map(([weapon, kills]) => (
        <div key={weapon} className={styles.usageRow}>
          <span className={styles.usageName}>{weapon.replace(/^weapon_/, '').toUpperCase()}</span>
          <span className={styles.usageTrack}>
            <span className={styles.usageFill} style={{ width: `${(kills / max) * 100}%` }} />
          </span>
          <span className="mono">{kills}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Mid-match statistics takeover (Alt+S) / head-to-head comparison (Alt+C):
 * the full per-player table for both teams plus weapon usage and the live
 * kill-position heatmap.
 */
export function StatsOverlay({ comparison, onClose }: { comparison: boolean; onClose: () => void }) {
  const { game, leftTeam, rightTeam, leftPlayers, rightPlayers } = useHUD();
  const config = useConfig();
  const stats = useAllStats();
  if (!game || !leftTeam || !rightTeam) return null;

  return (
    <motion.div
      className={`zone-overlay ${styles.statsRoot}`}
      variants={overlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <div className={styles.introHeader}>
        <span className={styles.introTournament}>{config.branding.tournament_name}</span>
        <span className={styles.introTitle}>{comparison ? 'HEAD TO HEAD' : 'MATCH STATISTICS'}</span>
      </div>

      <motion.div className={styles.statsBody} variants={staggerChildren(0.08, 0.1)} initial="hidden" animate="visible">
        <motion.section className={styles.statsSection} variants={slideUp}>
          <header className={styles.statsSectionHead} data-side={leftTeam.side}>
            <TeamLogo team={leftTeam} size={30} /> {leftTeam.name}
            <span className={`${styles.statsScore} mono`}>{leftTeam.score}</span>
          </header>
          <TeamTable players={leftPlayers} stats={stats} />
        </motion.section>

        <motion.section className={styles.statsSection} variants={slideUp}>
          <header className={styles.statsSectionHead} data-side={rightTeam.side}>
            <TeamLogo team={rightTeam} size={30} /> {rightTeam.name}
            <span className={`${styles.statsScore} mono`}>{rightTeam.score}</span>
          </header>
          <TeamTable players={rightPlayers} stats={stats} />
        </motion.section>

        <motion.section className={styles.statsExtras} variants={slideUp}>
          <WeaponUsage stats={stats} />
          <KillHeatmap players={game.players} stats={stats} />
        </motion.section>
      </motion.div>
    </motion.div>
  );
}
