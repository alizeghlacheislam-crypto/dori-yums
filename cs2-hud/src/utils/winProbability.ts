import type { HUDState, TeamInfo } from '@/types/hud';

/**
 * Live round win-probability model (logistic over hand-tuned features).
 *
 * This intentionally favours interpretability over ML precision: strength
 * is a weighted blend of alive players, pooled HP, and equipment, with a
 * bomb-state prior. The logistic squash keeps output stable and bounded,
 * and the caller smooths frame-to-frame changes in the UI layer.
 */
const teamStrength = (team: TeamInfo): number => {
  const alive = team.players.filter((p) => p.alive);
  const hpPool = alive.reduce((s, p) => s + p.health, 0) / 500; // 0..1
  const equip = alive.reduce((s, p) => s + p.equipValue, 0) / 25000; // ~0..1
  return alive.length / 5 + 0.45 * hpPool + 0.3 * Math.min(1, equip);
};

export const roundWinProbabilityLeft = (state: {
  left: TeamInfo;
  right: TeamInfo;
  bombPlanted: boolean;
  bombCountdown: number;
  defusing: boolean;
  roundPhase: string;
}): number => {
  const { left, right } = state;
  const leftAlive = left.aliveCount;
  const rightAlive = right.aliveCount;

  // Round already decided
  if (leftAlive === 0 && rightAlive > 0 && !(state.bombPlanted && left.side === 'T')) return 0.02;
  if (rightAlive === 0 && leftAlive > 0 && !(state.bombPlanted && right.side === 'T')) return 0.98;

  let diff = teamStrength(left) - teamStrength(right);

  if (state.bombPlanted) {
    // A ticking bomb swings the round to the T side, harder as it runs down.
    const urgency = 1 - Math.min(1, state.bombCountdown / 40);
    const tBonus = 0.55 + 0.9 * urgency - (state.defusing ? 0.5 : 0);
    diff += left.side === 'T' ? tBonus : -tBonus;
  }

  // Logistic squash: k controls how decisive an advantage reads on air.
  const k = 2.2;
  return 1 / (1 + Math.exp(-k * diff));
};

export const winProbability = (hud: Pick<HUDState, 'left' | 'right' | 'bomb' | 'match'>): number =>
  roundWinProbabilityLeft({
    left: hud.left,
    right: hud.right,
    bombPlanted: hud.bomb?.state === 'planted' || hud.bomb?.state === 'defusing',
    bombCountdown: hud.bomb?.countdown ?? 40,
    defusing: hud.bomb?.state === 'defusing',
    roundPhase: hud.match.roundPhase,
  });
