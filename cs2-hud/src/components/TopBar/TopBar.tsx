import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './TopBar.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useRoundClock } from '../../hooks/useRoundClock';
import { useBombTimer } from '../../hooks/useBombTimer';
import { clock, money } from '../../utils/format';
import { displayMapName } from '../../utils/maps';
import { teamEconomy, winProbability } from '../../utils/economy';
import { slideDown, t } from '../../animations';
import { TeamLogo } from '../shared/TeamLogo';
import { BombIcon, PauseIcon, TimerIcon } from '../shared/Icons';
import type { Player, Team } from 'csgogsi';

function seriesTarget(numToWin: number, override: 'auto' | 'bo1' | 'bo3' | 'bo5'): number {
  if (override === 'bo1') return 1;
  if (override === 'bo3') return 2;
  if (override === 'bo5') return 3;
  return Math.max(1, numToWin);
}

const SeriesDots = memo(function SeriesDots({ won, target, align }: { won: number; target: number; align: 'left' | 'right' }) {
  return (
    <div className={styles.seriesDots} data-align={align} aria-label={`Maps won: ${won} of ${target}`}>
      {Array.from({ length: target }, (_, i) => (
        <motion.span
          key={i}
          className={styles.seriesDot}
          data-filled={i < won}
          initial={false}
          animate={{ scale: i < won ? 1 : 0.85 }}
          transition={t(0.24)}
        />
      ))}
    </div>
  );
});

const AliveBar = memo(function AliveBar({ players, side, align }: { players: Player[]; side: 'CT' | 'T'; align: 'left' | 'right' }) {
  return (
    <div className={styles.aliveBar} data-align={align}>
      {players.map(p => (
        <motion.span
          key={p.steamid}
          className={styles.aliveSegment}
          data-side={side}
          initial={false}
          animate={{ opacity: p.state.health > 0 ? 1 : 0.16, scaleY: p.state.health > 0 ? 1 : 0.6 }}
          transition={t(0.3)}
        />
      ))}
    </div>
  );
});

function TeamBlock({ team, players, align }: { team: Team; players: Player[]; align: 'left' | 'right' }) {
  const { game } = useHUD();
  const config = useConfig();
  const eco = useMemo(
    () => (game ? teamEconomy(game.players, team.side, game.map) : null),
    [game, team.side]
  );
  const target = seriesTarget(game?.map.num_matches_to_win_series ?? 1, config.display.series_type);
  const hasCoach = Boolean(team.extra?.coach);

  return (
    <div className={styles.teamBlock} data-align={align} data-side={team.side}>
      <div className={styles.teamIdentity}>
        <TeamLogo team={team} size={46} />
        <div className={styles.teamText}>
          <span className={styles.teamName}>{team.name}</span>
          <div className={styles.teamMeta}>
            <span className={styles.sideTag} data-side={team.side}>
              {team.side}
            </span>
            {hasCoach && <span className={styles.coachTag}>COACH {team.extra.coach}</span>}
            <span className={styles.timeouts} aria-label="timeouts remaining">
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className={styles.timeoutPip} data-used={i >= team.timeouts_remaining} />
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.scoreCluster}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={team.score}
            className={`${styles.score} mono`}
            data-side={team.side}
            initial={{ y: align === 'left' ? -18 : 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: align === 'left' ? 18 : -18, opacity: 0 }}
            transition={t(0.3)}
          >
            {team.score}
          </motion.span>
        </AnimatePresence>
        {target > 1 && <SeriesDots won={team.matches_won_this_series} target={target} align={align} />}
      </div>

      <div className={styles.teamEco}>
        <AliveBar players={players} side={team.side} align={align} />
        {eco && (
          <div className={styles.ecoRow}>
            <span className={styles.ecoItem} title="Team money">
              {money(eco.money)}
            </span>
            <span className={styles.ecoDivider} />
            <span className={styles.ecoItem} title="Equipment value">
              EQ {money(eco.equipValue)}
            </span>
            <span className={styles.ecoDivider} />
            <span className={styles.ecoItem} title="Loss bonus">
              LB {money(eco.lossBonus)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CenterClock() {
  const roundClock = useRoundClock();
  const bomb = useBombTimer();
  const { game } = useHUD();
  if (!game) return null;

  const roundNumber = Math.min(game.map.round + 1, 999);
  const isLowTime = !bomb.planted && roundClock.live && roundClock.timeLeft <= 10;

  return (
    <div className={styles.centerClock}>
      <div className={styles.roundInfo}>
        <span>
          ROUND <span className="mono">{roundNumber}</span>
        </span>
      </div>
      <div className={styles.clockFace} data-bomb={bomb.planted} data-low={isLowTime}>
        <AnimatePresence mode="wait" initial={false}>
          {bomb.planted ? (
            <motion.div
              key="bomb"
              className={styles.bombClock}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={t(0.26)}
            >
              <BombIcon size={18} />
              <motion.span
                className="mono"
                animate={{ opacity: bomb.timeLeft < 10 ? [1, 0.45, 1] : 1 }}
                transition={{ duration: 0.4, repeat: bomb.timeLeft < 10 ? Infinity : 0 }}
              >
                {bomb.timeLeft.toFixed(bomb.timeLeft < 10 ? 1 : 0)}
              </motion.span>
            </motion.div>
          ) : roundClock.paused || roundClock.timeout ? (
            <motion.div
              key="pause"
              className={styles.pauseClock}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={t(0.2)}
            >
              <PauseIcon size={16} />
              <span className="mono">{clock(roundClock.timeLeft)}</span>
            </motion.div>
          ) : (
            <motion.span
              key="round"
              className={`${styles.roundTime} mono`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={t(0.2)}
            >
              {roundClock.warmup ? 'WARMUP' : clock(roundClock.timeLeft)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {bomb.planted && bomb.site && (
        <motion.div className={styles.siteTag} variants={slideDown} initial="hidden" animate="visible">
          SITE {bomb.site}
        </motion.div>
      )}
    </div>
  );
}

function WinProbabilityBar() {
  const { game, leftTeam } = useHUD();
  const bomb = useBombTimer();
  const prob = useMemo(() => {
    if (!game || !leftTeam) return 0.5;
    const ctProb = winProbability(game.players, bomb.planted, bomb.planted ? bomb.timeLeft : null);
    return leftTeam.side === 'CT' ? ctProb : 1 - ctProb;
  }, [game, leftTeam, bomb.planted, Math.round(bomb.timeLeft)]);

  if (!game || game.phase_countdowns.phase === 'warmup') return null;

  return (
    <div className={styles.winProb} aria-label="Round win probability">
      <motion.div
        className={styles.winProbFill}
        data-side={leftTeam?.side}
        initial={false}
        animate={{ width: `${prob * 100}%` }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className={`${styles.winProbLabel} mono`} style={{ left: 8 }}>
        {Math.round(prob * 100)}%
      </span>
      <span className={`${styles.winProbLabel} mono`} style={{ right: 8 }}>
        {Math.round((1 - prob) * 100)}%
      </span>
    </div>
  );
}

export function TopBar() {
  const { game, leftTeam, rightTeam, leftPlayers, rightPlayers } = useHUD();
  const config = useConfig();
  if (!game || !leftTeam || !rightTeam) return null;

  const bo = seriesTarget(game.map.num_matches_to_win_series, config.display.series_type) * 2 - 1;

  return (
    <motion.div className={styles.wrapper} variants={slideDown} initial="hidden" animate="visible">
      <div className={styles.brandRow}>
        {config.branding.tournament_logo ? (
          <img className={styles.brandLogo} src={config.branding.tournament_logo} alt="" />
        ) : (
          <span className={styles.brandName}>{config.branding.tournament_name}</span>
        )}
        {config.branding.match_title && <span className={styles.matchTitle}>{config.branding.match_title}</span>}
        <span className={styles.mapTag}>
          {displayMapName(game.map.name)} · BO{bo}
        </span>
        {config.branding.sponsor_logo && <img className={styles.brandLogo} src={config.branding.sponsor_logo} alt="" />}
      </div>

      <div className={styles.bar}>
        <TeamBlock team={leftTeam} players={leftPlayers} align="left" />
        <CenterClock />
        <TeamBlock team={rightTeam} players={rightPlayers} align="right" />
      </div>

      {config.modules.show_win_probability && <WinProbabilityBar />}
    </motion.div>
  );
}
