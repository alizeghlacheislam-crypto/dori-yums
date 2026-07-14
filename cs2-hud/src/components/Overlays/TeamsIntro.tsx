import { memo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './TeamsIntro.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { Avatar } from '@/components/shared/Avatar';
import { Flag } from '@/components/shared/Flag';
import { RoleIcon } from '@/components/shared/RoleIcon';
import { useGSI } from '@/contexts/GSIContext';
import { useConfig, useOverlays } from '@/contexts/ConfigContext';
import { mapDisplayName } from '@/utils/maps';
import { overlayCurtain, riseItem, staggerChildren } from '@/animations/variants';
import { cn } from '@/utils/cn';
import type { TeamInfo } from '@/types/hud';

/**
 * Pre-match full-screen: matchup title, both lineups with roles and
 * per-map series form, coaches, map/BO context and a rating-based
 * prediction meter. Toggled with Alt+I.
 */
export const TeamsIntro = memo(() => {
  const overlays = useOverlays();
  const { left, right, match } = useGSI();
  const config = useConfig();

  // Prediction from average live rating (falls back to 50/50 pre-match).
  const strength = (t: TeamInfo) =>
    t.players.length > 0
      ? t.players.reduce((s, p) => s + p.computed.rating, 0) / t.players.length
      : 1;
  const sl = strength(left);
  const sr = strength(right);
  const leftPct = sl + sr > 0 ? Math.round((sl / (sl + sr)) * 100) : 50;

  const vars = {
    '--left-color': left.side === 'CT' ? 'var(--ct)' : 'var(--t)',
    '--right-color': right.side === 'CT' ? 'var(--ct)' : 'var(--t)',
  } as CSSProperties;

  return (
    <AnimatePresence>
      {overlays.teamsIntro && (
        <motion.div
          className={styles.backdrop}
          style={vars}
          variants={overlayCurtain}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={styles.header}>
            <div className={styles.tournament}>{config.branding.tournamentName}</div>
            <div className={styles.matchup}>
              {left.name} <span style={{ color: 'var(--primary)' }}>vs</span> {right.name}
            </div>
            <div className={styles.meta}>
              {config.branding.matchTitle && `${config.branding.matchTitle} · `}
              BO{match.bestOf} · {mapDisplayName(match.mapName)} · {left.seriesScore}–
              {right.seriesScore}
            </div>
          </div>

          <div className={styles.teams}>
            <IntroTeam team={left} />
            <div className={styles.centerCol}>
              <span className={styles.vs}>VS</span>
              <GlassPanel card className={styles.prediction}>
                <span className={styles.predictionLabel}>FORM PREDICTION</span>
                <div className={styles.predictionBar}>
                  <div className={styles.predictionFill} style={{ width: `${leftPct}%` }} />
                </div>
                <div className={styles.predictionValues}>
                  <span>{leftPct}%</span>
                  <span>{100 - leftPct}%</span>
                </div>
              </GlassPanel>
            </div>
            <IntroTeam team={right} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
TeamsIntro.displayName = 'TeamsIntro';

const IntroTeam = memo(({ team }: { team: TeamInfo }) => {
  const rightAligned = team.orientation === 'right';
  return (
    <motion.div className={styles.team} variants={staggerChildren(0.06)} initial="hidden" animate="visible">
      <motion.div variants={riseItem}>
        <GlassPanel className={cn(styles.teamHead, rightAligned && styles.teamHeadRight)}>
          <TeamLogo logo={team.logo} name={team.name} shortName={team.shortName} size={54} />
          <div className={styles.teamTitle}>
            <span className={styles.teamName}>{team.name}</span>
            {team.coach && <span className={styles.teamCoach}>Coach · {team.coach}</span>}
          </div>
        </GlassPanel>
      </motion.div>
      {team.players.map((p) => (
        <motion.div key={p.steamid} variants={riseItem}>
          <GlassPanel card className={cn(styles.playerRow, rightAligned && styles.playerRowRight)}>
            <Avatar steamid={p.steamid} url={p.avatar} name={p.name} size={38} />
            <span className={styles.playerNick}>
              <Flag country={p.country} size={12} /> {p.name}
              {p.realName && <div className={styles.playerReal}>{p.realName}</div>}
            </span>
            {p.role && <RoleIcon role={p.role} size={13} />}
            <span className={styles.playerStats}>
              {p.computed.rating > 0 ? `${p.computed.rating.toFixed(2)} RTG` : '—'}
            </span>
          </GlassPanel>
        </motion.div>
      ))}
    </motion.div>
  );
});
IntroTeam.displayName = 'IntroTeam';
