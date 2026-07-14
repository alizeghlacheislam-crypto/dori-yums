import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './MapVeto.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { useGSI } from '@/contexts/GSIContext';
import { useConfig, useOverlays } from '@/contexts/ConfigContext';
import { useMatchData } from '@/hooks/useMatchData';
import { mapDisplayName } from '@/utils/maps';
import { overlayCurtain, riseItem, staggerChildren } from '@/animations/variants';
import { cn } from '@/utils/cn';

const TYPE_CLASS = {
  ban: styles.typeBan,
  pick: styles.typePick,
  decider: styles.typeDecider,
} as const;

/**
 * Map veto board straight from LHM's match record: bans dimmed, picks
 * highlighted, the decider gold — with live map scores once played.
 */
export const MapVeto = memo(() => {
  const overlays = useOverlays();
  const { left, right } = useGSI();
  const { match } = useMatchData();
  const config = useConfig();

  const teamFor = (teamId: string) =>
    teamId && left.id === teamId ? left : teamId && right.id === teamId ? right : undefined;

  return (
    <AnimatePresence>
      {overlays.veto && (
        <motion.div
          className={styles.backdrop}
          variants={overlayCurtain}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={styles.title}>Map veto</div>
          <div className={styles.subtitle}>
            {config.branding.tournamentName} · {left.name} vs {right.name}
          </div>

          <motion.div
            className={styles.list}
            variants={staggerChildren(0.07)}
            initial="hidden"
            animate="visible"
          >
            {(match?.vetos ?? [])
              .filter((v) => v.mapName)
              .map((veto, i) => {
                const team = teamFor(veto.teamId);
                const scoreLeft = veto.score && left.id ? veto.score[left.id] : undefined;
                const scoreRight = veto.score && right.id ? veto.score[right.id] : undefined;
                const winner = veto.winner ? teamFor(veto.winner) : undefined;
                return (
                  <motion.div key={`${veto.mapName}-${i}`} variants={riseItem}>
                    <GlassPanel
                      className={cn(
                        styles.row,
                        veto.type === 'ban' && styles.rowBan,
                        veto.type === 'decider' && styles.rowDecider,
                      )}
                    >
                      <span className={styles.team}>
                        {team ? (
                          <>
                            <TeamLogo
                              logo={team.logo}
                              name={team.name}
                              shortName={team.shortName}
                              size={22}
                            />
                            {team.shortName}
                          </>
                        ) : (
                          '—'
                        )}
                      </span>
                      <span className={styles.map}>
                        {mapDisplayName(veto.mapName)}
                        {veto.side !== 'NO' && team && (
                          <span className={styles.winnerTag}> · {veto.side} START</span>
                        )}
                      </span>
                      <span className={cn(styles.typeTag, TYPE_CLASS[veto.type])}>
                        {veto.type.toUpperCase()}
                      </span>
                      <span className={styles.score}>
                        {veto.mapEnd && scoreLeft !== undefined && scoreRight !== undefined
                          ? `${scoreLeft}–${scoreRight}`
                          : winner
                            ? winner.shortName
                            : ''}
                      </span>
                    </GlassPanel>
                  </motion.div>
                );
              })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
MapVeto.displayName = 'MapVeto';
