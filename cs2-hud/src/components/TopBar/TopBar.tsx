import { memo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import styles from './TopBar.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { CoachIcon } from '@/assets/icons/Icons';
import { useGSI } from '@/contexts/GSIContext';
import { useConfig } from '@/contexts/ConfigContext';
import { formatClock, formatCountdown, formatMoney } from '@/utils/format';
import { mapDisplayName } from '@/utils/maps';
import { lossBonusLevel } from '@/utils/economy';
import { slideIn } from '@/animations/variants';
import { cn } from '@/utils/cn';
import type { TeamInfo } from '@/types/hud';
import { WinProbabilityBar } from './WinProbabilityBar';

const sideVar = (team: TeamInfo): CSSProperties =>
  ({ '--side-color': team.side === 'CT' ? 'var(--ct)' : 'var(--t)' }) as CSSProperties;

/* ------------------------------------------------------------------ */

const TeamBlock = memo(({ team }: { team: TeamInfo }) => {
  const left = team.orientation === 'left';
  return (
    <GlassPanel
      className={cn(styles.team, left ? styles.teamLeft : styles.teamRight)}
      style={sideVar(team)}
      accent="top"
      accentColor={team.side === 'CT' ? 'var(--ct)' : 'var(--t)'}
    >
      <TeamLogo logo={team.logo} name={team.name} shortName={team.shortName} size={40} />
      <div className={styles.teamIdentity}>
        <div className={styles.teamName}>{team.name}</div>
        <div className={styles.sideTag}>
          <span>{team.side}</span>
          <span className={styles.aliveDots}>
            {team.players.map((p) => (
              <span
                key={p.steamid}
                className={cn(styles.aliveDot, !p.alive && styles.aliveDotDead)}
              />
            ))}
          </span>
          {team.coach && (
            <span className={styles.coach}>
              <CoachIcon size={10} />
              {team.coach}
            </span>
          )}
        </div>
      </div>
      <div className={styles.timeouts} title="Timeouts remaining">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(styles.timeoutDot, i >= team.timeoutsRemaining && styles.timeoutDotUsed)}
          />
        ))}
      </div>
      <div className={styles.score}>
        <AnimatedNumber value={team.score} />
      </div>
    </GlassPanel>
  );
});
TeamBlock.displayName = 'TeamBlock';

/* ------------------------------------------------------------------ */

const CenterClock = memo(() => {
  const { match, bomb } = useGSI();

  const bombLive = bomb?.state === 'planted' || bomb?.state === 'defusing';
  const defusing = bomb?.state === 'defusing';

  let clockText: string;
  let clockClass = styles.clock;
  if (bombLive) {
    clockText = formatCountdown(bomb?.countdown ?? 0);
    clockClass = cn(styles.clock, defusing ? styles.clockDefuse : styles.clockBomb);
  } else {
    clockText = formatClock(match.phaseEndsIn);
    if (match.roundPhase === 'live' && match.phaseEndsIn < 15) {
      clockClass = cn(styles.clock, styles.clockDanger);
    }
  }

  let phaseTag: string | null = null;
  if (match.isPaused) phaseTag = 'TECHNICAL PAUSE';
  else if (match.timeoutSide) phaseTag = `${match.timeoutSide} TACTICAL TIMEOUT`;
  else if (match.isWarmup) phaseTag = 'WARMUP';
  else if (match.matchPointFor) phaseTag = 'MATCH POINT';
  else if (match.mapPointFor) phaseTag = 'MAP POINT';
  else if (match.isOvertime) phaseTag = 'OVERTIME';

  return (
    <div className={styles.center}>
      <div className={clockClass}>{clockText}</div>
      <div className={styles.roundInfo}>
        Round {Math.min(match.roundNumber, 999)}
        {bomb?.site && bombLive ? ` · SITE ${bomb.site}` : ''}
      </div>
      {phaseTag && (
        <motion.div
          className={styles.phaseTag}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26 }}
        >
          {phaseTag}
        </motion.div>
      )}
    </div>
  );
});
CenterClock.displayName = 'CenterClock';

/* ------------------------------------------------------------------ */

const EconStrip = memo(({ team }: { team: TeamInfo }) => {
  const left = team.orientation === 'left';
  const level = lossBonusLevel(team.consecutiveLosses);
  return (
    <GlassPanel
      card
      className={cn(styles.econStrip, left && styles.econStripLeft)}
      style={sideVar(team)}
    >
      <span className={styles.econItem} title="Loss bonus level">
        <span className={styles.lossDots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={cn(styles.lossDot, i <= level && styles.lossDotActive)} />
          ))}
        </span>
        {formatMoney(team.lossBonus)}
      </span>
      <span className={styles.econItem}>
        BANK{' '}
        <AnimatedNumber className={styles.econValue} value={team.totalMoney} format={formatMoney} />
      </span>
      <span className={styles.econItem}>
        EQUIP{' '}
        <AnimatedNumber
          className={styles.econValue}
          value={team.totalEquipValue}
          format={formatMoney}
        />
      </span>
    </GlassPanel>
  );
});
EconStrip.displayName = 'EconStrip';

/* ------------------------------------------------------------------ */

const SeriesCenter = memo(() => {
  const { left, right, match } = useGSI();
  const winsNeeded = Math.ceil(match.bestOf / 2);
  return (
    <GlassPanel card className={styles.series}>
      <span className={styles.mapDots} style={sideVar(left)}>
        {Array.from({ length: winsNeeded }, (_, i) => (
          <span key={i} className={cn(styles.mapDot, i < left.seriesScore && styles.mapDotWon)} />
        ))}
      </span>
      <span className={styles.bo}>BO{match.bestOf}</span>
      <span className={styles.mapName}>{mapDisplayName(match.mapName)}</span>
      <span className={styles.bo}>·</span>
      <span className={styles.mapDots} style={sideVar(right)}>
        {Array.from({ length: winsNeeded }, (_, i) => (
          <span
            key={i}
            className={cn(styles.mapDot, winsNeeded - 1 - i < right.seriesScore && styles.mapDotWon)}
          />
        ))}
      </span>
    </GlassPanel>
  );
});
SeriesCenter.displayName = 'SeriesCenter';

/* ------------------------------------------------------------------ */

export const TopBar = memo(() => {
  const { left, right, winProbabilityLeft, match } = useGSI();
  const config = useConfig();

  return (
    <motion.div className={styles.root} variants={slideIn('up', 30)} initial="hidden" animate="visible">
      <div className={styles.mainRow} style={{ position: 'relative' }}>
        <TeamBlock team={left} />
        <CenterClock />
        <TeamBlock team={right} />

        {(config.branding.matchTitle || config.branding.tournamentName) && (
          <GlassPanel card className={styles.matchTitle}>
            <span className={styles.matchTitleMain}>
              {config.branding.matchTitle || 'SHOWMATCH'}
            </span>
            <span className={styles.matchTitleSub}>{config.branding.tournamentName}</span>
          </GlassPanel>
        )}

        {(config.branding.tournamentLogo || config.branding.sponsorLogo) && (
          <GlassPanel card className={styles.branding}>
            {config.branding.tournamentLogo && (
              <img className={styles.brandLogo} src={config.branding.tournamentLogo} alt="Tournament" />
            )}
            {config.branding.sponsorLogo && (
              <img className={styles.brandLogo} src={config.branding.sponsorLogo} alt="Sponsor" />
            )}
          </GlassPanel>
        )}
      </div>

      <div className={styles.subRow}>
        <EconStrip team={left} />
        <SeriesCenter />
        <EconStrip team={right} />
      </div>

      {config.modules.showWinProbability && !match.isWarmup && (
        <WinProbabilityBar value={winProbabilityLeft} leftSide={left.side} rightSide={right.side} />
      )}
    </motion.div>
  );
});
TopBar.displayName = 'TopBar';
