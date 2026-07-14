import type { Player } from 'csgogsi';

export type PlayerRole = 'igl' | 'awp' | 'entry' | 'support' | 'lurker' | 'anchor';

const ROLE_ALIASES: Record<string, PlayerRole> = {
  igl: 'igl',
  leader: 'igl',
  captain: 'igl',
  awp: 'awp',
  awper: 'awp',
  sniper: 'awp',
  entry: 'entry',
  fragger: 'entry',
  support: 'support',
  lurker: 'lurker',
  lurk: 'lurker',
  anchor: 'anchor'
};

/**
 * Player roles come from the "role" extra field configured per player inside
 * LHM (Players → edit → extra). Falls back to tagging the current AWP carrier.
 */
export function playerRole(player: Player): PlayerRole | null {
  const raw = (player.extra?.role ?? player.extra?.Role ?? '').toLowerCase().trim();
  if (raw && ROLE_ALIASES[raw]) return ROLE_ALIASES[raw];
  if (player.weapons.some(w => w.name.includes('awp'))) return 'awp';
  return null;
}

export function isCoach(player: Player): boolean {
  return (player.extra?.role ?? '').toLowerCase() === 'coach' || player.observer_slot === undefined;
}

/** Stable observer-slot ordering: slots 1-5 then 6-0 as the game assigns them. */
export function sortByObserverSlot(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const slot = (p: Player) => {
      const s = p.observer_slot ?? 99;
      return s === 0 ? 10 : s; // slot 0 renders last (it's key "0" = 10th player)
    };
    return slot(a) - slot(b);
  });
}

export function aliveCount(players: Player[]): number {
  return players.filter(p => p.state.health > 0).length;
}

/** Initials avatar fallback when a Steam avatar is missing. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** ISO country code → regional-indicator emoji flag (works in OBS/CEF). */
export function countryFlag(country: string | null): string | null {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}
