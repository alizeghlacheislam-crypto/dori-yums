import { memo, type SVGProps } from 'react';

/**
 * Flat 24×24 status & role glyph set. Everything inherits
 * `currentColor` so panels tint icons purely through CSS.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 14, ...rest }: IconProps): SVGProps<SVGSVGElement> => ({
  viewBox: '0 0 24 24',
  width: size,
  height: size,
  fill: 'currentColor',
  ...rest,
});

export const ArmorIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 L20 5 V11 C20 16.5 16.6 20.6 12 22 C7.4 20.6 4 16.5 4 11 V5 Z" />
  </svg>
));
ArmorIcon.displayName = 'ArmorIcon';

export const HelmetIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 14 a8 8 0 0 1 16 0 v3 h-3 v-3 a5 5 0 0 0 -10 0 v3 H4 Z" />
    <rect x="3" y="17" width="18" height="3" rx="1.2" />
  </svg>
));
HelmetIcon.displayName = 'HelmetIcon';

export const DefuseKitIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M9 8 V6 a3 3 0 0 1 6 0 v2 h-2.4 V6 a0.6 0.6 0 0 0 -1.2 0 v2 Z" />
    <path d="M8 12 l3.5 4 M11.5 12 l-3.5 4" stroke="#0b0d11" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="16" cy="14" r="1.6" fill="#0b0d11" />
  </svg>
));
DefuseKitIcon.displayName = 'DefuseKitIcon';

export const SkullIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 a8 8 0 0 0 -8 8 c0 3 1.6 5.4 4 6.8 V20 a2 2 0 0 0 2 2 h4 a2 2 0 0 0 2 -2 v-3.2 c2.4 -1.4 4 -3.8 4 -6.8 a8 8 0 0 0 -8 -8 Z M9 9 a2 2 0 1 1 0 4 a2 2 0 0 1 0 -4 Z M15 9 a2 2 0 1 1 0 4 a2 2 0 0 1 0 -4 Z M11 15 h2 l-1 2.4 Z" />
  </svg>
));
SkullIcon.displayName = 'SkullIcon';

export const HealthIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21 C6 16.5 3 13 3 9.3 A5.3 5.3 0 0 1 12 5.6 A5.3 5.3 0 0 1 21 9.3 C21 13 18 16.5 12 21 Z" />
  </svg>
));
HealthIcon.displayName = 'HealthIcon';

export const BombIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="14" r="7.5" />
    <rect x="9" y="4" width="4" height="3.4" rx="0.8" />
    <path d="M13.5 4.8 l4 -2.4 l1.2 1.8 l-3.8 2.4 Z" />
    <path d="M19 2 l1.6 1 M21 5 l1.4 -0.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
));
BombIcon.displayName = 'BombIcon';

export const TimerIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4 a8.5 8.5 0 1 0 0 17 a8.5 8.5 0 0 0 0 -17 Z M12 7 v5.5 l4 2.3 l-1 1.7 l-5 -3 V7 Z" />
    <rect x="9.5" y="1" width="5" height="2.4" rx="1" />
  </svg>
));
TimerIcon.displayName = 'TimerIcon';

export const StarIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 l2.9 6.2 6.6 0.8 -4.9 4.6 1.3 6.6 L12 17 l-5.9 3.2 1.3 -6.6 -4.9 -4.6 6.6 -0.8 Z" />
  </svg>
));
StarIcon.displayName = 'StarIcon';

export const PingIcon = memo(({ quality = 3, ...p }: IconProps & { quality?: 0 | 1 | 2 | 3 }) => (
  <svg {...base(p)}>
    <rect x="4" y="14" width="4" height="6" rx="1" opacity={quality >= 1 ? 1 : 0.25} />
    <rect x="10" y="9" width="4" height="11" rx="1" opacity={quality >= 2 ? 1 : 0.25} />
    <rect x="16" y="4" width="4" height="16" rx="1" opacity={quality >= 3 ? 1 : 0.25} />
  </svg>
));
PingIcon.displayName = 'PingIcon';

export const FlashedIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13.5 2 L5 13.5 h5.5 L9 22 L19 9.5 h-5.5 Z" />
  </svg>
));
FlashedIcon.displayName = 'FlashedIcon';

export const BurningIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 q4.5 4.5 1.6 8.4 q3.6 -0.8 4.4 -3.8 Q22 13 17.6 17.5 A8 8 0 0 1 6 17 Q3.4 12 8.5 7.6 q-0.4 3 1.4 4.2 Q8.6 6.4 12 2 Z" />
  </svg>
));
BurningIcon.displayName = 'BurningIcon';

export const SmokedIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 18 a4 4 0 0 1 -0.8 -7.9 A5.5 5.5 0 0 1 17 8.6 A4.5 4.5 0 0 1 17.5 18 Z" />
    <rect x="5" y="19.5" width="14" height="2" rx="1" opacity="0.6" />
  </svg>
));
SmokedIcon.displayName = 'SmokedIcon';

export const ReloadIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4 a8 8 0 1 0 8 8 h-2.6 a5.4 5.4 0 1 1 -5.4 -5.4 v3.4 l5.6 -4.4 L12 1 Z" />
  </svg>
));
ReloadIcon.displayName = 'ReloadIcon';

export const ScopeIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 a9 9 0 1 0 0 18 a9 9 0 0 0 0 -18 Z m0 2.4 a6.6 6.6 0 1 1 0 13.2 a6.6 6.6 0 0 1 0 -13.2 Z" />
    <path d="M12 1 v6 M12 17 v6 M1 12 h6 M17 12 h6" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.6" />
  </svg>
));
ScopeIcon.displayName = 'ScopeIcon';

export const WallbangIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="7" height="16" rx="1" opacity="0.55" />
    <path d="M6 12 h9 l-2 -2.6 2.6 -1 4.4 5 -4.4 5 -2.6 -1 2 -2.6 h-9 Z" />
  </svg>
));
WallbangIcon.displayName = 'WallbangIcon';

export const HeadshotIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 a7 7 0 0 0 -7 7 c0 2.6 1.4 4.7 3.5 5.9 V19 a1.8 1.8 0 0 0 1.8 1.8 h3.4 A1.8 1.8 0 0 0 15.5 19 v-3.1 C17.6 14.7 19 12.6 19 10 a7 7 0 0 0 -7 -7 Z" />
    <path d="M12 6.5 v7 M8.5 10 h7" stroke="#0b0d11" strokeWidth="1.5" />
    <circle cx="12" cy="10" r="1.4" fill="#0b0d11" />
  </svg>
));
HeadshotIcon.displayName = 'HeadshotIcon';

export const AirborneIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 l4 5 h-2.6 v6 h-2.8 V7 H8 Z" />
    <path d="M5 16 q7 5 14 0 v3 q-7 4.4 -14 0 Z" opacity="0.7" />
  </svg>
));
AirborneIcon.displayName = 'AirborneIcon';

export const BlindIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 12 q10 -11 20 0 q-10 11 -20 0 Z M12 8.4 a3.6 3.6 0 1 1 0 7.2 a3.6 3.6 0 0 1 0 -7.2 Z" />
    <path d="M4 20 L20 4" stroke="#0b0d11" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
));
BlindIcon.displayName = 'BlindIcon';

export const PauseIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <rect x="6" y="4" width="4.5" height="16" rx="1.4" />
    <rect x="13.5" y="4" width="4.5" height="16" rx="1.4" />
  </svg>
));
PauseIcon.displayName = 'PauseIcon';

export const ReplayIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4 V1 L6.5 5.5 12 10 V7 a6 6 0 1 1 -6 6 H3 a9 9 0 1 0 9 -9 Z" />
  </svg>
));
ReplayIcon.displayName = 'ReplayIcon';

export const CameraIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="M17 10 l5 -3 v10 l-5 -3 Z" />
  </svg>
));
CameraIcon.displayName = 'CameraIcon';

export const CoachIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21 a8 8 0 0 1 16 0 Z" />
    <path d="M17 3 a5.5 5.5 0 0 1 3 5 M17.5 6 a2.5 2.5 0 0 1 1.4 2.4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
));
CoachIcon.displayName = 'CoachIcon';

export const TrophyIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3 h12 v2 h3 v3 a5 5 0 0 1 -4.6 5 A7 7 0 0 1 13 16.7 V19 h3 v2.5 H8 V19 h3 v-2.3 A7 7 0 0 1 7.6 13 A5 5 0 0 1 3 8 V5 h3 Z M6 7 H5 v1 a3 3 0 0 0 1.6 2.7 A12 12 0 0 1 6 7 Z m13 0 h-1 a12 12 0 0 1 -0.6 3.7 A3 3 0 0 0 19 8 Z" />
  </svg>
));
TrophyIcon.displayName = 'TrophyIcon';

/* Role glyphs -------------------------------------------------------- */

export const IGLIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 8 l4.5 3.5 L12 5 l4.5 6.5 L21 8 l-1.6 10 H4.6 Z" />
  </svg>
));
IGLIcon.displayName = 'IGLIcon';

export const AWPerIcon = ScopeIcon;

export const SupportIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 L20 5 V11 C20 16.5 16.6 20.6 12 22 C7.4 20.6 4 16.5 4 11 V5 Z M12 6 v10 M7.5 11 h9" stroke="#0b0d11" strokeWidth="1.8" />
  </svg>
));
SupportIcon.displayName = 'SupportIcon';

export const AnchorIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 a3 3 0 0 1 1 5.8 V9 h4 v2.5 h-4 v6.8 a7 7 0 0 0 5 -5.3 h2.5 A9.5 9.5 0 0 1 12 22 A9.5 9.5 0 0 1 3.5 13 H6 a7 7 0 0 0 5 5.3 V11.5 H7 V9 h4 V7.8 A3 3 0 0 1 12 2 Z" />
  </svg>
));
AnchorIcon.displayName = 'AnchorIcon';

export const LurkerIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 a7 7 0 0 1 7 7 v11 l-3 -2.4 -2 2.4 -2 -2.4 -2 2.4 -2 -2.4 L5 21 V10 a7 7 0 0 1 7 -7 Z M9.5 9 a1.7 1.7 0 1 0 0 3.4 a1.7 1.7 0 0 0 0 -3.4 Z m5 0 a1.7 1.7 0 1 0 0 3.4 a1.7 1.7 0 0 0 0 -3.4 Z" />
  </svg>
));
LurkerIcon.displayName = 'LurkerIcon';

export const EntryIcon = memo((p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13 2 h8 v8 h-2.6 V6.6 L11 14 l-1.8 -1.8 L16.4 4.8 H13 Z" />
    <path d="M3 21 v-8 h2.6 v5.4 L13 11 l1.8 1.8 -7.4 7.4 H11 V21 Z" opacity="0.7" />
  </svg>
));
EntryIcon.displayName = 'EntryIcon';
