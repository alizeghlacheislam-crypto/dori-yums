import type { RawGSIData, RawPlayer, Side } from '@/types/gsi';
import type { KillEvent, Vec3 } from '@/types/hud';
import { normalizeWeaponId, weaponMeta } from '@/utils/weapons';
import { parseVec3 } from '@/utils/vector';

export interface RecentKill {
  attacker: string;
  victim: string;
  time: number;
}

export interface DetectorMemory {
  /** kills in the last few seconds, for trade detection */
  recentKills: RecentKill[];
  /** steamid → steamid of whoever killed them last (revenge detection) */
  lastKilledBy: Map<string, string>;
  /** steamid → recent z coordinates, for airborne detection */
  zHistory: Map<string, number[]>;
}

export const createDetectorMemory = (): DetectorMemory => ({
  recentKills: [],
  lastKilledBy: new Map(),
  zHistory: new Map(),
});

const TRADE_WINDOW_MS = 5000;
const SMOKE_RADIUS = 150;

/** 2D distance from point P to the segment AB — used for through-smoke checks. */
const pointToSegment2D = (p: Vec3, a: Vec3, b: Vec3): number => {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const lenSq = abx * abx + aby * aby;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / lenSq));
  return Math.hypot(p[0] - (a[0] + t * abx), p[1] - (a[1] + t * aby));
};

const activeWeaponOf = (p: RawPlayer | undefined): string => {
  if (!p?.weapons) return 'knife';
  const weapons = Object.values(p.weapons);
  const active = weapons.find((w) => w.state === 'active') ?? weapons[weapons.length - 1];
  return active ? normalizeWeaponId(active.name) : 'knife';
};

const sideOf = (p: RawPlayer | undefined): Side => (p?.team === 'T' ? 'T' : 'CT');

/**
 * Derive kill events by diffing two consecutive GSI frames.
 *
 * The scoreboard is the source of truth: an attacker is a player whose
 * `match_stats.kills` increased, a victim is one whose `deaths` increased.
 * A −1 kill delta marks a team kill (CS2 scoreboard penalty). Victims are
 * matched to attackers by team opposition; a single attacker with a kill
 * delta ≥ 2 in one frame is a collateral.
 */
export const detectKills = (
  prev: RawGSIData,
  curr: RawGSIData,
  memory: DetectorMemory,
  now: number,
): KillEvent[] => {
  const prevPlayers = prev.allplayers ?? {};
  const currPlayers = curr.allplayers ?? {};
  const events: KillEvent[] = [];

  // Maintain a short z-position history per player (airborne detection).
  for (const [steamid, p] of Object.entries(currPlayers)) {
    const z = parseVec3(p.position)[2];
    const hist = memory.zHistory.get(steamid) ?? [];
    hist.push(z);
    if (hist.length > 6) hist.shift();
    memory.zHistory.set(steamid, hist);
  }

  interface AttackerSlot {
    steamid: string;
    remaining: number;
    hsRemaining: number;
    total: number;
    teamkill: boolean;
  }

  const attackers: AttackerSlot[] = [];
  const victims: string[] = [];
  const assisters: string[] = [];

  for (const [steamid, p] of Object.entries(currPlayers)) {
    const q = prevPlayers[steamid];
    if (!q?.match_stats || !p.match_stats) continue;
    const dKills = p.match_stats.kills - q.match_stats.kills;
    const dHS = (p.state?.round_killhs ?? 0) - (q.state?.round_killhs ?? 0);
    if (dKills > 0) {
      attackers.push({ steamid, remaining: dKills, hsRemaining: Math.max(0, dHS), total: dKills, teamkill: false });
    } else if (dKills < 0) {
      attackers.push({ steamid, remaining: -dKills, hsRemaining: 0, total: -dKills, teamkill: true });
    }
    if (p.match_stats.deaths - q.match_stats.deaths > 0) victims.push(steamid);
    if (p.match_stats.assists - q.match_stats.assists > 0) assisters.push(steamid);
  }

  if (victims.length === 0) return events;

  const smokes = Object.values(curr.grenades ?? {})
    .filter((g) => g.type === 'smoke' && Number.parseFloat(g.effecttime ?? '0') > 0)
    .map((g) => parseVec3(g.position));

  for (const victimId of victims) {
    const victimPrev = prevPlayers[victimId];
    const victimCurr = currPlayers[victimId];
    const victimSide = sideOf(victimCurr ?? victimPrev);

    // Prefer an enemy attacker, then a team-killer, then rule it a suicide.
    const slot =
      attackers.find((a) => a.remaining > 0 && !a.teamkill && sideOf(currPlayers[a.steamid]) !== victimSide) ??
      attackers.find((a) => a.remaining > 0 && a.teamkill && sideOf(currPlayers[a.steamid]) === victimSide);

    const attackerId = slot?.steamid;
    const isSuicide = !attackerId || attackerId === victimId;
    const attackerCurr = attackerId ? currPlayers[attackerId] : undefined;
    const attackerPrev = attackerId ? prevPlayers[attackerId] : undefined;

    let headshot = false;
    if (slot && !slot.teamkill) {
      slot.remaining -= 1;
      if (slot.hsRemaining > 0) {
        headshot = true;
        slot.hsRemaining -= 1;
      }
    }

    const weaponId = isSuicide ? 'c4' : activeWeaponOf(attackerPrev ?? attackerCurr);
    const category = weaponMeta(weaponId).category;

    const attackerPos = parseVec3((attackerPrev ?? attackerCurr)?.position);
    const victimPos = parseVec3((victimPrev ?? victimCurr)?.position);
    const throughSmoke =
      !isSuicide &&
      (smokes.some((s) => pointToSegment2D(s, attackerPos, victimPos) < SMOKE_RADIUS) ||
        (victimPrev?.state?.smoked ?? 0) > 150);

    // Airborne: attacker's z varied meaningfully across the last frames.
    const zHist = attackerId ? (memory.zHistory.get(attackerId) ?? []) : [];
    const airborne = zHist.length >= 3 && Math.max(...zHist) - Math.min(...zHist) > 26;

    // No-scope heuristic: snipers hitting inside typical quick-scope range.
    const dist = Math.hypot(attackerPos[0] - victimPos[0], attackerPos[1] - victimPos[1]);
    const noscope = category === 'sniper' && dist < 350;

    const isTrade = memory.recentKills.some(
      (k) => k.attacker === victimId && now - k.time < TRADE_WINDOW_MS,
    );
    const isRevenge = !!attackerId && memory.lastKilledBy.get(attackerId) === victimId;

    // Scoreboard assister on the attacker's team, attributed to this kill.
    const assisterId = assisters.find(
      (a) => a !== attackerId && (!attackerCurr || sideOf(currPlayers[a]) === sideOf(attackerCurr)),
    );
    const flashAssist = !!assisterId && (victimPrev?.state?.flashed ?? 0) > 100;

    events.push({
      id: `${now}-${victimId}`,
      timestamp: now,
      attacker:
        attackerId && !isSuicide
          ? { steamid: attackerId, name: attackerCurr?.name ?? attackerId, side: sideOf(attackerCurr) }
          : undefined,
      victim: { steamid: victimId, name: (victimCurr ?? victimPrev)?.name ?? victimId, side: victimSide },
      assister: assisterId
        ? { steamid: assisterId, name: currPlayers[assisterId]?.name ?? assisterId, side: sideOf(currPlayers[assisterId]), flashAssist }
        : undefined,
      weaponId,
      weaponCategory: category,
      headshot,
      wallbang: false, // upgraded by the HLAE/mirv feed when available
      noscope,
      throughSmoke,
      attackerBlind: (attackerPrev?.state?.flashed ?? 0) > 200,
      attackerAirborne: airborne,
      isTeamkill: !!slot?.teamkill,
      isSuicide,
      isTrade,
      isRevenge,
      collateralCount: slot && !slot.teamkill ? slot.total : 1,
      multiKillIndex: attackerCurr?.state?.round_kills ?? 1,
    });

    if (attackerId && !isSuicide && !slot?.teamkill) {
      memory.recentKills.push({ attacker: attackerId, victim: victimId, time: now });
      memory.lastKilledBy.set(victimId, attackerId);
    }
  }

  // Trim the trade window.
  memory.recentKills = memory.recentKills.filter((k) => now - k.time < TRADE_WINDOW_MS);

  return events;
};
