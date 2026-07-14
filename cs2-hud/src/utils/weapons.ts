import type { Weapon, WeaponCategory } from '@/types/hud';
import type { RawWeapon } from '@/types/gsi';

interface WeaponMeta {
  displayName: string;
  category: WeaponCategory;
  /** in-game price, used for economy analysis */
  price: number;
}

/** Every purchasable / obtainable CS2 item keyed by its canonical id. */
export const WEAPON_TABLE: Record<string, WeaponMeta> = {
  // Pistols
  glock: { displayName: 'Glock-18', category: 'pistol', price: 200 },
  usp_silencer: { displayName: 'USP-S', category: 'pistol', price: 200 },
  hkp2000: { displayName: 'P2000', category: 'pistol', price: 200 },
  p250: { displayName: 'P250', category: 'pistol', price: 300 },
  elite: { displayName: 'Dual Berettas', category: 'pistol', price: 300 },
  fiveseven: { displayName: 'Five-SeveN', category: 'pistol', price: 500 },
  tec9: { displayName: 'Tec-9', category: 'pistol', price: 500 },
  cz75a: { displayName: 'CZ75-Auto', category: 'pistol', price: 500 },
  deagle: { displayName: 'Desert Eagle', category: 'pistol', price: 700 },
  revolver: { displayName: 'R8 Revolver', category: 'pistol', price: 600 },
  // SMGs
  mac10: { displayName: 'MAC-10', category: 'smg', price: 1050 },
  mp9: { displayName: 'MP9', category: 'smg', price: 1250 },
  mp7: { displayName: 'MP7', category: 'smg', price: 1500 },
  mp5sd: { displayName: 'MP5-SD', category: 'smg', price: 1500 },
  ump45: { displayName: 'UMP-45', category: 'smg', price: 1200 },
  p90: { displayName: 'P90', category: 'smg', price: 2350 },
  bizon: { displayName: 'PP-Bizon', category: 'smg', price: 1400 },
  // Rifles
  famas: { displayName: 'FAMAS', category: 'rifle', price: 1950 },
  galilar: { displayName: 'Galil AR', category: 'rifle', price: 1800 },
  m4a4: { displayName: 'M4A4', category: 'rifle', price: 2900 },
  m4a1_silencer: { displayName: 'M4A1-S', category: 'rifle', price: 2900 },
  ak47: { displayName: 'AK-47', category: 'rifle', price: 2700 },
  aug: { displayName: 'AUG', category: 'rifle', price: 3300 },
  sg556: { displayName: 'SG 553', category: 'rifle', price: 3000 },
  // Snipers
  ssg08: { displayName: 'SSG 08', category: 'sniper', price: 1700 },
  awp: { displayName: 'AWP', category: 'sniper', price: 4750 },
  scar20: { displayName: 'SCAR-20', category: 'sniper', price: 5000 },
  g3sg1: { displayName: 'G3SG1', category: 'sniper', price: 5000 },
  // Shotguns
  nova: { displayName: 'Nova', category: 'shotgun', price: 1050 },
  xm1014: { displayName: 'XM1014', category: 'shotgun', price: 2000 },
  sawedoff: { displayName: 'Sawed-Off', category: 'shotgun', price: 1100 },
  mag7: { displayName: 'MAG-7', category: 'shotgun', price: 1300 },
  // Machine guns
  m249: { displayName: 'M249', category: 'machinegun', price: 5200 },
  negev: { displayName: 'Negev', category: 'machinegun', price: 1700 },
  // Grenades
  hegrenade: { displayName: 'HE Grenade', category: 'grenade', price: 300 },
  flashbang: { displayName: 'Flashbang', category: 'grenade', price: 200 },
  smokegrenade: { displayName: 'Smoke', category: 'grenade', price: 300 },
  molotov: { displayName: 'Molotov', category: 'grenade', price: 400 },
  incgrenade: { displayName: 'Incendiary', category: 'grenade', price: 600 },
  decoy: { displayName: 'Decoy', category: 'grenade', price: 50 },
  // Other
  taser: { displayName: 'Zeus x27', category: 'taser', price: 200 },
  c4: { displayName: 'C4', category: 'c4', price: 0 },
  knife: { displayName: 'Knife', category: 'knife', price: 0 },
  healthshot: { displayName: 'Medi-Shot', category: 'grenade', price: 0 },
};

/** Strip Valve prefixes: `weapon_ak47` → `ak47`, knife variants → `knife`. */
export const normalizeWeaponId = (rawName: string): string => {
  const id = rawName.replace(/^weapon_/, '');
  if (id.startsWith('knife') || id === 'bayonet' || id.endsWith('_bayonet')) return 'knife';
  return id;
};

export const weaponMeta = (id: string): WeaponMeta =>
  WEAPON_TABLE[id] ?? { displayName: id.replace(/_/g, ' ').toUpperCase(), category: 'pistol', price: 0 };

export const parseWeapon = (raw: RawWeapon): Weapon => {
  const id = normalizeWeaponId(raw.name);
  const meta = weaponMeta(id);
  return {
    id,
    displayName: meta.displayName,
    category: meta.category,
    state: raw.state,
    ammoClip: raw.ammo_clip ?? 0,
    ammoClipMax: raw.ammo_clip_max ?? 0,
    ammoReserve: raw.ammo_reserve ?? 0,
  };
};

export const isPrimaryCategory = (c: WeaponCategory): boolean =>
  c === 'smg' || c === 'rifle' || c === 'sniper' || c === 'shotgun' || c === 'machinegun';

/** Fixed display order for the utility belt on player cards. */
const GRENADE_ORDER = ['smokegrenade', 'flashbang', 'hegrenade', 'molotov', 'incgrenade', 'decoy'];

export const sortGrenades = (grenades: Weapon[]): Weapon[] =>
  [...grenades].sort((a, b) => GRENADE_ORDER.indexOf(a.id) - GRENADE_ORDER.indexOf(b.id));
