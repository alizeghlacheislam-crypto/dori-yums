import type { Player } from '@/types/hud';

/**
 * CS2 loss-bonus ladder. `consecutive_round_losses` from GSI is the current
 * streak counter (0-based index into this ladder for the NEXT loss payout).
 */
const LOSS_BONUS_LADDER = [1400, 1900, 2400, 2900, 3400] as const;

export const lossBonus = (consecutiveLosses: number): number =>
  LOSS_BONUS_LADDER[Math.min(consecutiveLosses, LOSS_BONUS_LADDER.length - 1)];

export const lossBonusLevel = (consecutiveLosses: number): number =>
  Math.min(consecutiveLosses, LOSS_BONUS_LADDER.length - 1);

export type BuyTier = 'full' | 'force' | 'semi' | 'eco' | 'pistol';

export interface TeamEconomySnapshot {
  totalMoney: number;
  totalEquipValue: number;
  averageMoney: number;
  buyTier: BuyTier;
  /** predicted tier for the NEXT round if this one is lost */
  nextRoundPrediction: BuyTier;
}

/**
 * Classify a team's current buy from equipment value.
 * Thresholds follow common broadcast conventions:
 * full ≥ $20k team equipment, force ≥ $10k spent with low bank, etc.
 */
export const classifyBuy = (players: Player[], roundNumber: number, halfLengthRounds = 12): BuyTier => {
  const isPistolRound = roundNumber === 1 || roundNumber === halfLengthRounds + 1;
  if (isPistolRound) return 'pistol';
  const equip = players.reduce((sum, p) => sum + (p.alive ? p.equipValue : 0), 0);
  const alive = Math.max(1, players.filter((p) => p.alive).length);
  const perPlayer = equip / alive;
  if (perPlayer >= 3800) return 'full';
  if (perPlayer >= 2400) return 'force';
  if (perPlayer >= 1300) return 'semi';
  return 'eco';
};

/**
 * Predict next round's buy if the current round is LOST: everyone banks
 * their money + the next loss bonus, minus survivors' kept equipment offset.
 */
export const predictNextBuy = (players: Player[], consecutiveLosses: number): BuyTier => {
  const nextBonus = lossBonus(consecutiveLosses);
  const projected =
    players.reduce((sum, p) => sum + p.money, 0) / Math.max(1, players.length) + nextBonus;
  if (projected >= 4700) return 'full';
  if (projected >= 3200) return 'force';
  if (projected >= 2000) return 'semi';
  return 'eco';
};

export const teamEconomy = (
  players: Player[],
  consecutiveLosses: number,
  roundNumber: number,
): TeamEconomySnapshot => {
  const totalMoney = players.reduce((sum, p) => sum + p.money, 0);
  const totalEquipValue = players.reduce((sum, p) => sum + p.equipValue, 0);
  return {
    totalMoney,
    totalEquipValue,
    averageMoney: totalMoney / Math.max(1, players.length),
    buyTier: classifyBuy(players, roundNumber),
    nextRoundPrediction: predictNextBuy(players, consecutiveLosses),
  };
};

export const BUY_TIER_LABELS: Record<BuyTier, string> = {
  full: 'FULL BUY',
  force: 'FORCE BUY',
  semi: 'SEMI BUY',
  eco: 'ECO',
  pistol: 'PISTOL',
};
