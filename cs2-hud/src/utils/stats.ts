import type { Player } from '@/types/hud';

/**
 * Broadcast rating — an HLTV-1.0-style composite computed live from data
 * the HUD can actually observe. Weighted sum of kill rating, survival
 * rating and multi-kill impact, normalised so 1.00 is an average game.
 */
export const computeRating = (
  kills: number,
  deaths: number,
  multiKillRounds: number,
  roundsPlayed: number,
): number => {
  if (roundsPlayed <= 0) return 0;
  const avgKPR = 0.679; // league-average kills per round
  const avgSPR = 0.317; // league-average survived rounds per round
  const avgRMK = 1.277; // league-average multi-kill score baseline
  const killRating = kills / roundsPlayed / avgKPR;
  // Deaths can exceed tracked rounds when the HUD attaches mid-match;
  // floor survival at 0 so the composite never goes negative.
  const survivalRating = Math.max(0, roundsPlayed - deaths) / roundsPlayed / avgSPR;
  const multiKillRating = (kills + 2.3 * multiKillRounds) / roundsPlayed / avgRMK;
  return Math.max(0, (killRating + 0.7 * survivalRating + multiKillRating) / 2.7);
};

export const headshotPct = (headshotKills: number, kills: number): number =>
  kills > 0 ? headshotKills / kills : 0;

export const kd = (kills: number, deaths: number): number =>
  deaths > 0 ? kills / deaths : kills;

/** Sort helper: rating desc, then kills desc. */
export const byRating = (a: Player, b: Player): number =>
  b.computed.rating - a.computed.rating || b.stats.kills - a.stats.kills;

export const matchMVP = (players: Player[]): Player | undefined =>
  [...players].sort(byRating)[0];
