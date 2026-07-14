import type {
  BombInfo,
  ClutchState,
  GrenadeInfo,
  HUDState,
  LHMMatch,
  LHMTeam,
  MatchState,
  Player,
  PlayerRole,
  RoundHistoryEntry,
  TeamInfo,
  Weapon,
} from '@/types/hud';
import type { RawGSIData, RawPlayer, RawTeamState, Side } from '@/types/gsi';
import type { StatsTracker } from './statsTracker';
import { isPrimaryCategory, parseWeapon, sortGrenades } from '@/utils/weapons';
import { parseVec3 } from '@/utils/vector';
import { lossBonus } from '@/utils/economy';
import { mapConfig, nearestSite } from '@/utils/maps';
import { shortTeamName } from '@/utils/format';
import { winProbability } from '@/utils/winProbability';
import { teamLogoUrl } from './lhmApi';

const ROLE_VALUES: PlayerRole[] = ['igl', 'awper', 'support', 'anchor', 'lurker', 'entry'];

const parseRole = (extra?: Record<string, string>): PlayerRole | undefined => {
  const raw = extra?.role?.toLowerCase().trim();
  return ROLE_VALUES.find((r) => r === raw);
};

export interface ParserContext {
  lhmMatch: LHMMatch | null;
  leftTeam: LHMTeam | null;
  rightTeam: LHMTeam | null;
  tracker: StatsTracker;
  clutch?: ClutchState;
  connected: boolean;
}

/* ------------------------------------------------------------------ */
/* Side / orientation resolution                                       */
/* ------------------------------------------------------------------ */

/**
 * Which in-game side is displayed on the LEFT of the broadcast.
 * When an LHM match is loaded, orientation is pinned to the match's
 * left/right team ids, so it survives halftime side swaps. Without
 * match data, CT renders left (broadcast convention).
 */
export const resolveLeftSide = (raw: RawGSIData, lhmMatch: LHMMatch | null): Side => {
  const ctId = raw.map?.team_ct.id;
  const tId = raw.map?.team_t.id;
  if (lhmMatch?.left.id && ctId && lhmMatch.left.id === ctId) return 'CT';
  if (lhmMatch?.left.id && tId && lhmMatch.left.id === tId) return 'T';
  return 'CT';
};

/** MR12 half index of a 1-based round number (0, 1, then OT halves of 3). */
const halfIndex = (round: number): number => {
  if (round <= 12) return 0;
  if (round <= 24) return 1;
  return 2 + Math.floor((round - 25) / 3);
};

/* ------------------------------------------------------------------ */
/* Players                                                             */
/* ------------------------------------------------------------------ */

const parsePlayer = (
  steamid: string,
  raw: RawPlayer,
  observedSteamid: string | undefined,
  bomb: RawGSIData['bomb'],
  tracker: StatsTracker,
): Player => {
  const state = raw.state;
  const weapons: Weapon[] = Object.values(raw.weapons ?? {}).map(parseWeapon);
  const active = weapons.find((w) => w.state === 'active');
  const primary = weapons.find((w) => isPrimaryCategory(w.category));
  const secondary = weapons.find((w) => w.category === 'pistol');
  const grenades = sortGrenades(weapons.filter((w) => w.category === 'grenade' && w.id !== 'healthshot'));
  const kills = raw.match_stats?.kills ?? 0;
  tracker.setDeaths(steamid, raw.match_stats?.deaths ?? 0);

  return {
    steamid,
    name: raw.name,
    realName: raw.realName ?? undefined,
    country: raw.country ?? undefined,
    avatar: raw.avatar ?? undefined,
    role: parseRole(raw.extra),
    observerSlot: raw.observer_slot ?? 0,
    side: raw.team === 'T' ? 'T' : 'CT',
    alive: (state?.health ?? 0) > 0,
    health: state?.health ?? 0,
    armor: state?.armor ?? 0,
    helmet: state?.helmet ?? false,
    defuseKit: state?.defusekit ?? false,
    flashed: state?.flashed ?? 0,
    smoked: state?.smoked ?? 0,
    burning: state?.burning ?? 0,
    money: state?.money ?? 0,
    equipValue: state?.equip_value ?? 0,
    roundKills: state?.round_kills ?? 0,
    roundKillsHS: state?.round_killhs ?? 0,
    roundDamage: state?.round_totaldmg ?? 0,
    stats: {
      kills,
      assists: raw.match_stats?.assists ?? 0,
      deaths: raw.match_stats?.deaths ?? 0,
      mvps: raw.match_stats?.mvps ?? 0,
      score: raw.match_stats?.score ?? 0,
    },
    computed: tracker.computedFor(steamid, kills),
    weapons,
    activeWeapon: active,
    primaryWeapon: primary,
    secondaryWeapon: secondary,
    grenades,
    hasBomb: weapons.some((w) => w.category === 'c4') || bomb?.player === steamid,
    hasKnife: weapons.some((w) => w.category === 'knife'),
    hasTaser: weapons.some((w) => w.category === 'taser'),
    isScoped: active?.category === 'sniper',
    isReloading: active?.state === 'reloading',
    isPlanting: bomb?.state === 'planting' && bomb.player === steamid,
    isDefusing: (bomb?.state === 'defusing') && bomb.player === steamid,
    position: parseVec3(raw.position),
    forward: parseVec3(raw.forward),
    isObserved: steamid === observedSteamid,
  };
};

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

const buildTeam = (
  side: Side,
  orientation: 'left' | 'right',
  rawTeam: RawTeamState,
  lhmTeam: LHMTeam | null,
  players: Player[],
): TeamInfo => {
  const name =
    lhmTeam?.name ?? rawTeam.name ?? (side === 'CT' ? 'Counter-Terrorists' : 'Terrorists');
  const id = lhmTeam?._id ?? rawTeam.id;
  return {
    id,
    name,
    shortName: lhmTeam?.shortName || shortTeamName(name),
    side,
    orientation,
    score: rawTeam.score,
    seriesScore: rawTeam.matches_won_this_series,
    consecutiveLosses: rawTeam.consecutive_round_losses,
    timeoutsRemaining: rawTeam.timeouts_remaining,
    logo: id ? teamLogoUrl(id) : rawTeam.logo,
    country: lhmTeam?.country ?? rawTeam.flag,
    coach: lhmTeam?.extra?.coach ?? rawTeam.extra?.coach,
    players,
    aliveCount: players.filter((p) => p.alive).length,
    totalMoney: players.reduce((s, p) => s + p.money, 0),
    totalEquipValue: players.reduce((s, p) => s + p.equipValue, 0),
    lossBonus: lossBonus(rawTeam.consecutive_round_losses),
  };
};

/* ------------------------------------------------------------------ */
/* Full frame                                                          */
/* ------------------------------------------------------------------ */

export const parseState = (raw: RawGSIData, ctx: ParserContext): HUDState => {
  const observedSteamid =
    raw.player?.steamid && raw.player.observer_slot !== undefined ? raw.player.steamid : undefined;

  const players = Object.entries(raw.allplayers ?? {})
    .map(([steamid, p]) => parsePlayer(steamid, p, observedSteamid, raw.bomb, ctx.tracker))
    .sort((a, b) => a.observerSlot - b.observerSlot);

  const leftSide = resolveLeftSide(raw, ctx.lhmMatch);
  const rightSide: Side = leftSide === 'CT' ? 'T' : 'CT';
  const rawCT = raw.map?.team_ct ?? emptyTeamState();
  const rawT = raw.map?.team_t ?? emptyTeamState();

  const left = buildTeam(
    leftSide,
    'left',
    leftSide === 'CT' ? rawCT : rawT,
    ctx.leftTeam,
    players.filter((p) => p.side === leftSide),
  );
  const right = buildTeam(
    rightSide,
    'right',
    rightSide === 'CT' ? rawCT : rawT,
    ctx.rightTeam,
    players.filter((p) => p.side === rightSide),
  );

  /* Bomb --------------------------------------------------------- */
  let bomb: BombInfo | undefined;
  if (raw.bomb) {
    const pos = parseVec3(raw.bomb.position);
    const cfg = raw.map ? mapConfig(raw.map.name) : undefined;
    bomb = {
      state: raw.bomb.state,
      position: pos,
      countdown: Number.parseFloat(raw.bomb.countdown ?? '0') || 0,
      playerSteamid: raw.bomb.player,
      site:
        cfg && ['planting', 'planted', 'defusing', 'defused', 'exploded'].includes(raw.bomb.state)
          ? nearestSite(cfg, pos, raw.map?.name)
          : undefined,
    };
  }

  /* Grenades ------------------------------------------------------ */
  const grenades: GrenadeInfo[] = Object.entries(raw.grenades ?? {}).map(([id, g]) => {
    const owner = g.owner ? players.find((p) => p.steamid === g.owner) : undefined;
    return {
      id,
      type: g.type,
      owner: g.owner,
      ownerSide: owner?.side,
      position: parseVec3(g.position),
      lifetime: Number.parseFloat(g.lifetime ?? '0') || 0,
      effecttime: Number.parseFloat(g.effecttime ?? '0') || 0,
      flames: Object.values(g.flames ?? {}).map(parseVec3),
    };
  });

  /* Match / rounds ------------------------------------------------ */
  const roundNumber = (raw.map?.round ?? 0) + (raw.round?.phase === 'over' ? 0 : 1);
  const currentHalf = halfIndex(Math.max(1, roundNumber));
  const roundWins: RoundHistoryEntry[] = Object.entries(raw.map?.round_wins ?? {}).map(
    ([roundStr, cause]) => {
      const round = Number.parseInt(roundStr, 10);
      const winnerSide: Side = cause.startsWith('ct') ? 'CT' : 'T';
      // Resolve which broadcast side won: if that round was in a different
      // half-parity than the current one, the teams were on swapped sides.
      const sameSides = (halfIndex(round) - currentHalf) % 2 === 0;
      const sideOnLeftThen: Side = sameSides ? leftSide : leftSide === 'CT' ? 'T' : 'CT';
      return {
        round,
        winner: winnerSide,
        cause,
        winnerOrientation: winnerSide === sideOnLeftThen ? 'left' : ('right' as const),
      };
    },
  );

  const phase = raw.phase_countdowns?.phase ?? 'live';
  const bestOf = ctx.lhmMatch
    ? Number.parseInt(ctx.lhmMatch.matchType.replace('bo', ''), 10) || 1
    : Math.max(1, (raw.map?.num_matches_to_win_series ?? 1) * 2 - 1);

  // Map point: the score one round short of the current win target,
  // accounting for MR3 overtimes extending the target past 13.
  let winTarget = 13;
  while (Math.min(left.score, right.score) >= winTarget - 1) winTarget += 3;
  const mapPointFor =
    left.score === winTarget - 1 && right.score < winTarget - 1
      ? ('left' as const)
      : right.score === winTarget - 1 && left.score < winTarget - 1
        ? ('right' as const)
        : undefined;
  const seriesTarget = Math.floor(bestOf / 2);
  const matchPointFor =
    mapPointFor === 'left' && left.seriesScore >= seriesTarget
      ? ('left' as const)
      : mapPointFor === 'right' && right.seriesScore >= seriesTarget
        ? ('right' as const)
        : undefined;

  const match: MatchState = {
    mapName: raw.map?.name ?? '',
    mapPhase: raw.map?.phase ?? 'warmup',
    roundNumber,
    roundPhase: raw.round?.phase ?? 'freezetime',
    bombRoundState: raw.round?.bomb,
    roundWinTeam: raw.round?.win_team,
    phase,
    phaseEndsIn: Number.parseFloat(raw.phase_countdowns?.phase_ends_in ?? '0') || 0,
    isPaused: phase === 'paused',
    timeoutSide: phase === 'timeout_ct' ? 'CT' : phase === 'timeout_t' ? 'T' : undefined,
    isFreezetime: raw.round?.phase === 'freezetime',
    isWarmup: raw.map?.phase === 'warmup',
    isOvertime: roundNumber > 24,
    matchPointFor,
    mapPointFor,
    bestOf,
    roundWins,
  };

  const hud: HUDState = {
    connected: ctx.connected,
    left,
    right,
    players,
    observed: players.find((p) => p.isObserved),
    observerSteamid: observedSteamid,
    match,
    bomb,
    grenades,
    clutch: ctx.clutch,
    winProbabilityLeft: 0.5,
    frameTimestamp: Date.now(),
  };
  hud.winProbabilityLeft = winProbability(hud);
  return hud;
};

const emptyTeamState = (): RawTeamState => ({
  score: 0,
  consecutive_round_losses: 0,
  timeouts_remaining: 1,
  matches_won_this_series: 0,
});
