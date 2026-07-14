import { memo } from 'react';
import { weaponMeta, type WeaponClass } from '../../utils/weapons';

/**
 * Stylised weapon silhouettes on a 48×20 grid — one recognisable profile per
 * weapon family. Silhouettes stay legible at killfeed size (16px tall) while
 * keeping the bundle free of game-ripped assets.
 */
const SILHOUETTES: Record<WeaponClass, string> = {
  pistol:
    'M8 4h24v4.5h-6l-1 5.5h-5l1-5.5H14v7H8.5L7 8.5H2V6.5C2 5 3.5 4 5 4h3Z',
  smg: 'M2 6h6l1-2h20v4h14v3H33l-1.5 5h-5l1.5-5H18v6h-6l-1.5-6H4L2 9V6Z',
  rifle:
    'M1 7h8l1-2h22l1 2h13v3h-9l-2 2h-8l-1 5h-5l1-5h-9v4H8l-2-4H2L1 9V7Z',
  sniper:
    'M0 8h10l2-3h7l2 3h26v2.6H32l-2 2.4h-7l-1.5 6h-4l1.5-6h-6v4h-5l-2-6H0V8Z M19 3.5h8v-2h-8v2Z',
  shotgun: 'M2 7h10v-2h28v4h6v3h-8l-2 2H16v5h-6v-5H4L2 11V7Z',
  mg: 'M2 5h8v2h28v4h8v3h-10l-2 2h-6l-1 4h-5l1-4H12v4H6v-6H2V5Z',
  knife: 'M4 14C10 6 20 3 30 3l4 2c-6 6-14 9-22 10l-3 3H4v-4Z',
  taser: 'M14 4h16v5h6v3h-8l-3 4h-8l2-6h-7l2-6Z M32 13l6 3-3 1 4 3-8-3 3-1-2-3Z',
  c4: 'M10 3h28v14H10V3Z M14 6h8v8h-8V6Z M26 6h9v3h-9V6Z M26 11h9v3h-9v-3Z',
  'grenade-he':
    'M20 6a8 8 0 1 0 8 8 8 8 0 0 0-8-8Z M17 3h6v3h-6V3Z M24 1h5v3h-5V1Z',
  'grenade-flash': 'M20 5a8 8 0 1 0 8 8 8 8 0 0 0-8-8Z M17 2h6v3h-6V2Z',
  'grenade-smoke': 'M14 4h12v4h-12z M12 8h16v10a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8Z',
  'grenade-molotov':
    'M16 8h8v3l4 5a5 5 0 0 1-4.5 7h-7A5 5 0 0 1 12 16l4-5V8Z M17 3h6v4h-6V3Z M23 1l5 3-2 2-4-3 1-2Z',
  'grenade-decoy': 'M20 6a8 8 0 1 0 8 8 8 8 0 0 0-8-8Z M20 10v8 M16 14h8'
};

interface Props {
  /** Raw GSI weapon name, e.g. "weapon_ak47". */
  name: string;
  height?: number;
  active?: boolean;
  className?: string;
}

export const WeaponIcon = memo(function WeaponIcon({ name, height = 18, active = true, className }: Props) {
  const meta = weaponMeta(name);
  return (
    <svg
      width={height * 2.4}
      height={height}
      viewBox="0 0 48 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={meta.label}
      style={{ opacity: active ? 1 : 0.38, flexShrink: 0 }}
    >
      <path d={SILHOUETTES[meta.cls]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
});

export const WeaponLabel = memo(function WeaponLabel({ name }: { name: string }) {
  return <>{weaponMeta(name).label}</>;
});
