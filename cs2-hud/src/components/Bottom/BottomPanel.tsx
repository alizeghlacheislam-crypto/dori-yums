import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './BottomPanel.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useEconomyHistory } from '../../hooks/useMatchStats';
import { useRoundClock } from '../../hooks/useRoundClock';
import { teamEconomy } from '../../utils/economy';
import { money } from '../../utils/format';
import { slideUp } from '../../animations';
import { TeamLogo } from '../shared/TeamLogo';
import { BombIcon, DefuseKitIcon, SkullIcon, TimerIcon } from '../shared/Icons';
import type { RoundOutcome, Side, Team } from 'csgogsi';

const OUTCOME_META: Record<RoundOutcome, { winner: Side; icon: 'bomb' | 'defuse' | 'time' | 'skull' }> = {
  t_win_bomb: { winner: 'T', icon: 'bomb' },
  t_win_elimination: { winner: 'T', icon: 'skull' },
  ct_win_elimination: { winner: 'CT', icon: 'skull' },
  ct_win_defuse: { winner: 'CT', icon: 'defuse' },
  ct_win_time: { winner: 'CT', icon: 'time' }
};

const OutcomeIcon = memo(function OutcomeIcon({ icon }: { icon: 'bomb' | 'defuse' | 'time' | 'skull' }) {
  switch (icon) {
    case 'bomb':
      return <BombIcon size={10} />;
    case 'defuse':
      return <DefuseKitIcon size={10} />;
    case 'time':
      return <TimerIcon size={10} />;
    default:
      return <SkullIcon size={10} />;
  }
});

/**
 * Round history strip: one pip per played round, grouped by half, coloured by
 * the side that converted it. `sideAtRound` un-swaps halftime so pips always
 * reflect which *team* won, matching how casters read the strip.
 */
function RoundHistory() {
  const { game, leftTeam } = useHUD();
  if (!game || !leftTeam) return null;

  const rounds = Object.entries(game.map.round_wins)
    .map(([round, outcome]) => ({ round: parseInt(round, 10), outcome }))
    .sort((a, b) => a.round - b.round)
    .slice(-24);

  const sideAtRound = (round: number): Side => {
    // Regulation halftime after round 12; OT halves every 3 from round 24.
    const leftNow = leftTeam.side;
    const currentRound = game.map.round + 1;
    const halfIndex = (r: number) => (r <= 12 ? 0 : r <= 24 ? 1 : 2 + Math.floor((r - 25) / 3));
    return halfIndex(round) === halfIndex(currentRound) ? leftNow : leftNow === 'CT' ? 'T' : 'CT';
  };

  return (
    <div className={styles.history}>
      {rounds.map(({ round, outcome }) => {
        const meta = OUTCOME_META[outcome];
        if (!meta) return null;
        const leftWon = meta.winner === sideAtRound(round);
        return (
          <div key={round} className={styles.roundPip} data-winner={meta.winner} data-top={leftWon}>
            <span className={styles.pipIcon}>
              <OutcomeIcon icon={meta.icon} />
            </span>
            <span className={`${styles.pipRound} mono`}>{round}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Equipment-value trend per round, drawn as two mirrored bar series. */
function EconomyGraph() {
  const history = useEconomyHistory();
  const { leftTeam } = useHUD();
  const recent = history.slice(-12);
  const max = Math.max(20000, ...recent.flatMap(h => [h.ctEquip, h.tEquip]));
  if (recent.length < 2 || !leftTeam) return null;

  const leftIsCT = leftTeam.side === 'CT';
  return (
    <div className={styles.graph} aria-label="Equipment value per round">
      {recent.map(h => (
        <div key={h.round} className={styles.graphCol} title={`Round ${h.round}`}>
          <div
            className={styles.graphBarTop}
            data-side={leftIsCT ? 'CT' : 'T'}
            style={{ height: `${((leftIsCT ? h.ctEquip : h.tEquip) / max) * 100}%` }}
          />
          <div
            className={styles.graphBarBottom}
            data-side={leftIsCT ? 'T' : 'CT'}
            style={{ height: `${((leftIsCT ? h.tEquip : h.ctEquip) / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function TeamEcoBlock({ team, align }: { team: Team; align: 'left' | 'right' }) {
  const { game } = useHUD();
  const eco = useMemo(() => (game ? teamEconomy(game.players, team.side, game.map) : null), [game, team.side]);
  if (!eco) return null;
  return (
    <div className={styles.ecoBlock} data-align={align}>
      <TeamLogo team={team} size={30} />
      <div className={styles.ecoDetail}>
        <span className={styles.ecoBuy} data-tier={eco.buy}>
          {eco.buy}
        </span>
        <span className={styles.ecoNumbers}>
          {money(eco.money)} · EQ {money(eco.equipValue)} · LB {money(eco.lossBonus)}
        </span>
      </div>
    </div>
  );
}

/**
 * Freeze-time economy read: both teams' money, equipment, loss bonus and buy
 * prediction around the equipment-value graph and full round history.
 */
export function BottomPanel() {
  const { game, leftTeam, rightTeam } = useHUD();
  const config = useConfig();
  const roundClock = useRoundClock();

  // The economy read belongs to freezetime; keep history visible mid-round.
  const showEco = roundClock.freezetime || roundClock.paused || Boolean(roundClock.timeout);
  if (!game || !leftTeam || !rightTeam || game.map.phase === 'warmup') return null;
  if (!showEco && !config.modules.show_round_history) return null;

  return (
    <motion.div className={styles.wrapper} variants={slideUp} initial="hidden" animate="visible" exit="exit" layout>
      {showEco && (
        <div className={styles.ecoRow}>
          <TeamEcoBlock team={leftTeam} align="left" />
          <EconomyGraph />
          <TeamEcoBlock team={rightTeam} align="right" />
        </div>
      )}
      {config.modules.show_round_history && <RoundHistory />}
    </motion.div>
  );
}
