import { memo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './EconomyPanel.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useGSI } from '@/contexts/GSIContext';
import { useConfig, useOverlays } from '@/contexts/ConfigContext';
import { useEconomyHistory, type EconomyRound } from '@/hooks/useEconomyHistory';
import { BUY_TIER_LABELS, teamEconomy } from '@/utils/economy';
import { formatMoney } from '@/utils/format';
import { slideIn } from '@/animations/variants';
import { cn } from '@/utils/cn';
import type { TeamInfo } from '@/types/hud';

const GRAPH_W = 740;
const GRAPH_H = 110;
const MAX_EQUIP = 32000;

/**
 * Freezetime economy module: per-team bank/equipment/loss bonus, current
 * buy classification, next-round buy prediction, and an SVG equipment-
 * value graph across the map. Also toggleable via the Alt+B action.
 */
export const EconomyPanel = memo(() => {
  const { left, right, match } = useGSI();
  const config = useConfig();
  const overlays = useOverlays();
  const history = useEconomyHistory();

  const autoVisible = config.modules.showEconomyGraph && match.isFreezetime && !match.isWarmup;
  const visible = overlays.bottomPanel || autoVisible;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div variants={slideIn('down', 24)} initial="hidden" animate="visible" exit="exit">
          <GlassPanel className={styles.root}>
            <div className={styles.title}>Economy</div>
            <div className={styles.teamsRow}>
              <TeamEconomyBlock team={left} roundNumber={match.roundNumber} />
              <span className={styles.vsLabel}>ROUND {match.roundNumber}</span>
              <TeamEconomyBlock team={right} roundNumber={match.roundNumber} />
            </div>
            {history.length >= 2 && (
              <div className={styles.graphWrap}>
                <EconomyGraph history={history} leftSide={left.side} rightSide={right.side} />
                <div className={styles.graphLegend}>
                  <span>
                    <span
                      className={styles.legendSwatch}
                      style={{ background: left.side === 'CT' ? 'var(--ct)' : 'var(--t)' }}
                    />
                    {left.shortName} EQUIPMENT
                  </span>
                  <span>
                    <span
                      className={styles.legendSwatch}
                      style={{ background: right.side === 'CT' ? 'var(--ct)' : 'var(--t)' }}
                    />
                    {right.shortName} EQUIPMENT
                  </span>
                </div>
              </div>
            )}
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
EconomyPanel.displayName = 'EconomyPanel';

/* ------------------------------------------------------------------ */

const buyTagClass = (tier: string): string =>
  cn(
    styles.buyTag,
    tier === 'eco' && styles.buyTagEco,
    tier === 'full' && styles.buyTagFull,
    (tier === 'force' || tier === 'semi') && styles.buyTagForce,
  );

const TeamEconomyBlock = memo(({ team, roundNumber }: { team: TeamInfo; roundNumber: number }) => {
  const econ = teamEconomy(team.players, team.consecutiveLosses, roundNumber);
  const rightAligned = team.orientation === 'right';
  const vars = { '--side-color': team.side === 'CT' ? 'var(--ct)' : 'var(--t)' } as CSSProperties;

  return (
    <div className={cn(styles.teamEcon, rightAligned && styles.teamEconRight)} style={vars}>
      <div className={styles.teamHeader}>
        {!rightAligned && (
          <TeamLogo logo={team.logo} name={team.name} shortName={team.shortName} size={22} />
        )}
        {team.name}
        {rightAligned && (
          <TeamLogo logo={team.logo} name={team.name} shortName={team.shortName} size={22} />
        )}
      </div>
      <div className={styles.econLine}>
        <span>
          BANK <AnimatedNumber value={econ.totalMoney} format={formatMoney} />
        </span>
        <span>
          EQUIP <AnimatedNumber value={econ.totalEquipValue} format={formatMoney} />
        </span>
        <span>
          LOSS BONUS <b>{formatMoney(team.lossBonus)}</b>
        </span>
      </div>
      <div className={styles.econLine}>
        <span className={buyTagClass(econ.buyTier)}>{BUY_TIER_LABELS[econ.buyTier]}</span>
        <span>
          IF LOST NEXT:{' '}
          <span className={buyTagClass(econ.nextRoundPrediction)}>
            {BUY_TIER_LABELS[econ.nextRoundPrediction]}
          </span>
        </span>
      </div>
    </div>
  );
});
TeamEconomyBlock.displayName = 'TeamEconomyBlock';

/* ------------------------------------------------------------------ */

const EconomyGraph = memo(
  ({
    history,
    leftSide,
    rightSide,
  }: {
    history: EconomyRound[];
    leftSide: 'CT' | 'T';
    rightSide: 'CT' | 'T';
  }) => {
    const stepX = GRAPH_W / Math.max(1, history.length - 1);
    const y = (equip: number) => GRAPH_H - Math.min(1, equip / MAX_EQUIP) * (GRAPH_H - 8) - 4;
    const linePath = (key: 'leftEquip' | 'rightEquip') =>
      history.map((e, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${y(e[key])}`).join(' ');

    return (
      <svg width="100%" viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} style={{ display: 'block' }}>
        {[8000, 16000, 24000].map((level) => (
          <g key={level}>
            <line
              x1={0}
              x2={GRAPH_W}
              y1={y(level)}
              y2={y(level)}
              stroke="rgba(255,255,255,0.07)"
              strokeDasharray="3 5"
            />
            <text x={4} y={y(level) - 3} fontSize={7} fill="var(--text-dim)" fontWeight={600}>
              {level / 1000}k
            </text>
          </g>
        ))}
        <path
          d={linePath('leftEquip')}
          fill="none"
          stroke={leftSide === 'CT' ? 'var(--ct)' : 'var(--t)'}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={linePath('rightEquip')}
          fill="none"
          stroke={rightSide === 'CT' ? 'var(--ct)' : 'var(--t)'}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {history.map((e, i) => (
          <g key={e.round}>
            <circle cx={i * stepX} cy={y(e.leftEquip)} r={2.4} fill={leftSide === 'CT' ? 'var(--ct)' : 'var(--t)'} />
            <circle cx={i * stepX} cy={y(e.rightEquip)} r={2.4} fill={rightSide === 'CT' ? 'var(--ct)' : 'var(--t)'} />
          </g>
        ))}
      </svg>
    );
  },
);
EconomyGraph.displayName = 'EconomyGraph';
