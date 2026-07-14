import type { Weapon } from 'csgogsi';

/** Weapon families used for icon silhouettes and layout decisions. */
export type WeaponClass =
  | 'pistol'
  | 'smg'
  | 'rifle'
  | 'sniper'
  | 'shotgun'
  | 'mg'
  | 'knife'
  | 'taser'
  | 'c4'
  | 'grenade-he'
  | 'grenade-flash'
  | 'grenade-smoke'
  | 'grenade-molotov'
  | 'grenade-decoy';

interface WeaponMeta {
  label: string;
  cls: WeaponClass;
}

/** Strips the game's `weapon_` prefix, e.g. "weapon_ak47" → "ak47". */
export const cleanWeaponName = (name: string): string => name.replace(/^weapon_/, '');

const W: Record<string, WeaponMeta> = {
  // pistols
  deagle: { label: 'DESERT EAGLE', cls: 'pistol' },
  revolver: { label: 'R8 REVOLVER', cls: 'pistol' },
  glock: { label: 'GLOCK-18', cls: 'pistol' },
  usp_silencer: { label: 'USP-S', cls: 'pistol' },
  hkp2000: { label: 'P2000', cls: 'pistol' },
  p250: { label: 'P250', cls: 'pistol' },
  fiveseven: { label: 'FIVE-SEVEN', cls: 'pistol' },
  tec9: { label: 'TEC-9', cls: 'pistol' },
  cz75a: { label: 'CZ75-AUTO', cls: 'pistol' },
  elite: { label: 'DUAL BERETTAS', cls: 'pistol' },
  // SMGs
  mp9: { label: 'MP9', cls: 'smg' },
  mac10: { label: 'MAC-10', cls: 'smg' },
  mp7: { label: 'MP7', cls: 'smg' },
  mp5sd: { label: 'MP5-SD', cls: 'smg' },
  ump45: { label: 'UMP-45', cls: 'smg' },
  p90: { label: 'P90', cls: 'smg' },
  bizon: { label: 'PP-BIZON', cls: 'smg' },
  // rifles
  ak47: { label: 'AK-47', cls: 'rifle' },
  m4a1: { label: 'M4A4', cls: 'rifle' },
  m4a1_silencer: { label: 'M4A1-S', cls: 'rifle' },
  famas: { label: 'FAMAS', cls: 'rifle' },
  galilar: { label: 'GALIL AR', cls: 'rifle' },
  aug: { label: 'AUG', cls: 'rifle' },
  sg556: { label: 'SG 553', cls: 'rifle' },
  // snipers
  awp: { label: 'AWP', cls: 'sniper' },
  ssg08: { label: 'SSG 08', cls: 'sniper' },
  scar20: { label: 'SCAR-20', cls: 'sniper' },
  g3sg1: { label: 'G3SG1', cls: 'sniper' },
  // shotguns
  nova: { label: 'NOVA', cls: 'shotgun' },
  xm1014: { label: 'XM1014', cls: 'shotgun' },
  mag7: { label: 'MAG-7', cls: 'shotgun' },
  sawedoff: { label: 'SAWED-OFF', cls: 'shotgun' },
  // machine guns
  m249: { label: 'M249', cls: 'mg' },
  negev: { label: 'NEGEV', cls: 'mg' },
  // melee / misc
  knife: { label: 'KNIFE', cls: 'knife' },
  taser: { label: 'ZEUS x27', cls: 'taser' },
  c4: { label: 'C4', cls: 'c4' },
  planted_c4: { label: 'C4', cls: 'c4' },
  inferno: { label: 'FIRE', cls: 'grenade-molotov' },
  // grenades
  hegrenade: { label: 'HE GRENADE', cls: 'grenade-he' },
  flashbang: { label: 'FLASHBANG', cls: 'grenade-flash' },
  smokegrenade: { label: 'SMOKE', cls: 'grenade-smoke' },
  molotov: { label: 'MOLOTOV', cls: 'grenade-molotov' },
  incgrenade: { label: 'INCENDIARY', cls: 'grenade-molotov' },
  decoy: { label: 'DECOY', cls: 'grenade-decoy' }
};

export function weaponMeta(rawName: string): WeaponMeta {
  const name = cleanWeaponName(rawName);
  if (W[name]) return W[name];
  if (name.startsWith('knife') || name === 'bayonet' || name.includes('knife')) {
    return { label: 'KNIFE', cls: 'knife' };
  }
  return { label: name.replace(/_/g, ' ').toUpperCase(), cls: 'rifle' };
}

export const isGrenade = (w: Weapon): boolean => w.type === 'Grenade';
export const isPrimary = (w: Weapon): boolean =>
  w.type === 'Rifle' ||
  w.type === 'SniperRifle' ||
  w.type === 'Submachine Gun' ||
  w.type === 'Shotgun' ||
  w.type === 'Machine Gun';
export const isSecondary = (w: Weapon): boolean => w.type === 'Pistol';

export function activeWeapon(weapons: Weapon[]): Weapon | undefined {
  return weapons.find(w => w.state === 'active' || w.state === 'reloading') ?? weapons.find(isPrimary) ?? weapons[0];
}

export function primaryWeapon(weapons: Weapon[]): Weapon | undefined {
  return weapons.find(isPrimary);
}

export function secondaryWeapon(weapons: Weapon[]): Weapon | undefined {
  return weapons.find(isSecondary);
}

export function grenades(weapons: Weapon[]): Weapon[] {
  return weapons.filter(isGrenade);
}

export function hasKnife(weapons: Weapon[]): boolean {
  return weapons.some(w => w.type === 'Knife');
}

export function isScoped(weapons: Weapon[]): boolean {
  // CS2 GSI does not expose a scoped flag; an active sniper rifle mid-round is
  // the closest reliable broadcast signal, so we badge active AWP/autos.
  const active = weapons.find(w => w.state === 'active');
  return active?.type === 'SniperRifle';
}

export function isReloading(weapons: Weapon[]): boolean {
  return weapons.some(w => w.state === 'reloading');
}
