import { motion } from 'framer-motion';
import styles from './Overlays.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { useConfig } from '../../contexts/ConfigContext';
import { displayMapName } from '../../utils/maps';
import { overlay, slideLeft, staggerChildren } from '../../animations';
import { TeamLogo } from '../shared/TeamLogo';
import type { VetoItem } from '../../types/match';

function teamForVeto(veto: VetoItem, leftId: string | null, leftName: string, rightName: string): string {
  if (veto.type === 'decider') return 'DECIDER';
  return veto.teamId === leftId ? leftName : rightName;
}

/**
 * Series veto board (Alt+V) rendered from the LHM match record: bans, picks,
 * the decider, per-map winners and final scores as the series progresses.
 */
export function MapVeto({ onClose }: { onClose: () => void }) {
  const { match, leftTeam, rightTeam } = useHUD();
  const config = useConfig();

  const vetos = match?.vetos?.filter(v => v.mapName) ?? [];
  const leftId = match?.left.id ?? leftTeam?.id ?? null;
  const leftName = leftTeam?.name ?? 'TEAM A';
  const rightName = rightTeam?.name ?? 'TEAM B';

  return (
    <motion.div
      className={`zone-overlay ${styles.vetoRoot}`}
      variants={overlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <div className={styles.introHeader}>
        <span className={styles.introTournament}>{config.branding.tournament_name}</span>
        <span className={styles.introTitle}>MAP VETO · {(match?.matchType ?? 'bo3').toUpperCase()}</span>
      </div>

      <div className={styles.vetoTeams}>
        <span className={styles.vetoTeam}>
          <TeamLogo team={leftTeam} size={36} /> {leftName}
        </span>
        <span className={styles.vetoTeam}>
          {rightName} <TeamLogo team={rightTeam} size={36} />
        </span>
      </div>

      <motion.div className={styles.vetoList} variants={staggerChildren(0.07, 0.15)} initial="hidden" animate="visible">
        {vetos.length === 0 && <div className={styles.vetoEmpty}>VETO NOT AVAILABLE YET</div>}
        {vetos.map((veto, i) => {
          const winnerName = veto.winner ? (veto.winner === leftId ? leftName : rightName) : null;
          const scoreLine =
            veto.score && leftId && Object.keys(veto.score).length >= 2
              ? Object.entries(veto.score)
                  .sort(([a], [b]) => (a === leftId ? -1 : b === leftId ? 1 : 0))
                  .map(([, s]) => s)
                  .join(' : ')
              : null;
          return (
            <motion.div key={`${veto.mapName}-${i}`} className={styles.vetoRow} data-type={veto.type} variants={slideLeft}>
              <span className={styles.vetoIndex} aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.vetoAction} data-type={veto.type}>
                {veto.type.toUpperCase()}
              </span>
              <span className={styles.vetoMap}>{displayMapName(veto.mapName)}</span>
              <span className={styles.vetoBy}>{teamForVeto(veto, leftId, leftName, rightName)}</span>
              {veto.side !== 'NO' && <span className={styles.vetoSide}>{veto.side} START</span>}
              {veto.mapEnd && winnerName && (
                <span className={styles.vetoResult}>
                  {winnerName} {scoreLine ? `· ${scoreLine}` : 'WIN'}
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
