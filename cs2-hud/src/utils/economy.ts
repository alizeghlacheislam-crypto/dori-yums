import type { Player, Side, Map as GameMap } from 'csgogsi';

/** CS2 loss bonus ladder: $1400 base + $500 per consecutive loss, capped. */
export const LOSS_BONUS_STEPS = [1400, 1900, 2400, 2900, 3400] as const;

export function lossBonus(consecutiveLosses: number): number {
  const idx = Math.min(Math.max(consecutiveLosses, 0), LOSS_BONUS_STEPS.length - 1);
  return LOSS_BONUS_STEPS[idx];
}

export interface TeamEconomy {
  money: number;
  equipValue: number;
  alive: number;
  lossBonus: number;
  avgMoney: number;
  buy: BuyTier;
}

export type BuyTier = 'FULL BUY' | 'FORCE BUY' | 'SEMI BUY' | 'SEMI ECO' | 'FULL ECO';

/**
 * Predicts next-round buy capability from current money + guaranteed loss
 * bonus income — the classic caster heuristic thresholds.
 */
export function predictBuy(avgMoneyNextRound: number): BuyTier {
  if (avgMoneyNextRound >= 4500) return 'FULL BUY';
  if (avgMoneyNextRound >= 3200) return 'FORCE BUY';
  if (avgMoneyNextRound >= 2200) return 'SEMI BUY';
  if (avgMoneyNextRound >= 1200) return 'SEMI ECO';
  return 'FULL ECO';
}

export function teamEconomy(players: Player[], side: Side, map: GameMap): TeamEconomy {
  const teamPlayers = players.filter(p => p.team.side === side);
  const money = teamPlayers.reduce((a, p) => a + p.state.money, 0);
  const equipValue = teamPlayers.reduce((a, p) => a + p.state.equip_value, 0);
  const alive = teamPlayers.filter(p => p.state.health > 0).length;
  const team = side === 'CT' ? map.team_ct : map.team_t;
  const bonus = lossBonus(team.consecutive_round_losses);
  const count = Math.max(1, teamPlayers.length);
  const avgMoney = money / count;
  // Assume a loss for the pessimistic buy prediction casters care about.
  const predicted = (money + bonus * count) / count;
  return { money, equipValue, alive, lossBonus: bonus, avgMoney, buy: predictBuy(predicted) };
}

/**
 * Lightweight round win-probability model. Deliberately simple and fully
 * explainable on air: alive players dominate, HP/equipment/bomb state nudge.
 * Returns CT win probability in [0.02, 0.98].
 */
export function winProbability(players: Player[], bombPlanted: boolean, bombTimeLeft: number | null): number {
  const alive = players.filter(p => p.state.health > 0);
  const ct = alive.filter(p => p.team.side === 'CT');
  const t = alive.filter(p => p.team.side === 'T');

  if (ct.length === 0 && t.length === 0) return 0.5;
  if (ct.length === 0) return 0.02;
  if (t.length === 0 && !bombPlanted) return 0.98;

  const hp = (list: Player[]) => list.reduce((a, p) => a + p.state.health, 0);
  const eq = (list: Player[]) => list.reduce((a, p) => a + p.state.equip_value, 0);

  // Alive-count difference is the strongest single predictor.
  let logit = 0.85 * (ct.length - t.length);
  logit += 0.004 * (hp(ct) - hp(t));
  logit += 0.00002 * (eq(ct) - eq(t));

  if (bombPlanted) {
    // Post-plant heavily favors T, increasingly so as the clock runs down.
    logit -= 1.1;
    if (bombTimeLeft !== null && bombTimeLeft < 15) logit -= 0.8;
    if (t.length === 0) logit += 1.4; // CTs only need the defuse
  }

  const p = 1 / (1 + Math.exp(-logit));
  return Math.min(0.98, Math.max(0.02, p));
}
