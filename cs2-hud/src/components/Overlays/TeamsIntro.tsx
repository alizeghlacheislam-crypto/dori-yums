import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player, Team } from 'csgogsi';
import styles from './Overlays.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { useConfig } from '../../contexts/ConfigContext';
import { displayMapName } from '../../utils/maps';
import { initials, playerRole } from '../../utils/players';
import { overlay, slideUp, staggerChildren } from '../../animations';
import { Flag } from '../shared/Flag';
import { TeamLogo } from '../shared/TeamLogo';
import { CoachIcon } from '../shared/Icons';

function LineupCard({ player }: { player: Player }) {
  const [failed, setFailed] = useState(false);
  const role = playerRole(player);
  return (
    <motion.div className={styles.lineupCard} data-side={player.team.side} variants={slideUp}>
      <div className={styles.lineupAvatar}>
        {player.avatar && !failed ? (
          <img src={player.avatar} alt="" onError={() => setFailed(true)} />
        ) : (
          <span>{initials(player.name)}</span>
        )}
      </div>
      <span className={styles.lineupName}>
        <Flag country={player.country} height={10} /> {player.name}
      </span>
      {player.realName && <span className={styles.lineupReal}>{player.realName}</span>}
      {role && <span className={styles.lineupRole}>{role.toUpperCase()}</span>}
    </motion.div>
  );
}

function TeamSide({ team, players }: { team: Team; players: Player[] }) {
  const coach = team.extra?.coach;
  return (
    <div className={styles.introTeam}>
      <div className={styles.introTeamHead} data-side={team.side}>
        <TeamLogo team={team} size={72} />
        <div>
          <span className={styles.introTeamName}>{team.name}</span>
          <span className={styles.introTeamSide}>{team.side} SIDE</span>
          {coach && (
            <span className={styles.introCoach}>
              <CoachIcon size={12} /> COACH · {coach}
            </span>
          )}
        </div>
      </div>
      <motion.div className={styles.lineupGrid} variants={staggerChildren(0.06, 0.1)}>
        {players.map(p => (
          <LineupCard key={p.steamid} player={p} />
        ))}
      </motion.div>
    </div>
  );
}

/** Pre-match team intro / lineups takeover (Alt+L). */
export function TeamsIntro({ onClose }: { onClose: () => void }) {
  const { game, leftTeam, rightTeam, leftPlayers, rightPlayers } = useHUD();
  const config = useConfig();
  if (!game || !leftTeam || !rightTeam) return null;

  return (
    <motion.div
      className={`zone-overlay ${styles.introRoot}`}
      variants={overlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <div className={styles.introHeader}>
        <span className={styles.introTournament}>{config.branding.tournament_name}</span>
        <span className={styles.introMap}>{displayMapName(game.map.name)}</span>
        {config.branding.match_title && <span className={styles.introTitle}>{config.branding.match_title}</span>}
      </div>
      <div className={styles.introBody}>
        <TeamSide team={leftTeam} players={leftPlayers} />
        <div className={styles.introVs}>VS</div>
        <TeamSide team={rightTeam} players={rightPlayers} />
      </div>
    </motion.div>
  );
}
