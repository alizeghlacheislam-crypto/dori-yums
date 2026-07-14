import type { SVGProps } from 'react';

/**
 * Broadcast icon set — every glyph is drawn on a 24×24 grid with geometric
 * strokes so the whole HUD reads as one family at any scale.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 16, ...rest }: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  ...rest
});

export const HealthIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M12 20s-7-4.35-9.33-8.44C1 8.6 2.76 5 6.4 5c2.08 0 3.6 1.2 4.4 2.4L12 9l1.2-1.6C14 6.2 15.52 5 17.6 5c3.64 0 5.4 3.6 3.73 6.56C19 15.65 12 20 12 20Z"
      fill="currentColor"
    />
  </svg>
);

export const ArmorIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 5 5.5v6.2c0 4.3 3 7.4 7 9.3 4-1.9 7-5 7-9.3V5.5L12 3Z" fill="currentColor" />
  </svg>
);

export const HelmetIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M4 14a8 8 0 0 1 16 0v3h-4.5l-1-3h-5l-1 3H4v-3Z"
      fill="currentColor"
    />
    <rect x="9" y="17.5" width="6" height="2.5" rx="1" fill="currentColor" />
  </svg>
);

export const DefuseKitIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="8" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" />
    <path d="M12 11.5v4M10 13.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SkullIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M12 3a8 8 0 0 0-8 8c0 2.6 1.2 4.4 3 5.6V20a1 1 0 0 0 1 1h1.5v-2h1.5v2h2v-2H15v2h1a1 1 0 0 0 1-1v-3.4c1.8-1.2 3-3 3-5.6a8 8 0 0 0-8-8Z"
      fill="currentColor"
    />
    <circle cx="9" cy="11" r="1.8" fill="#0B0D11" />
    <circle cx="15" cy="11" r="1.8" fill="#0B0D11" />
  </svg>
);

export const HeadshotIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const WallbangIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 4h6v6H4zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.6" />
    <path d="m13 4 8 7-4 .5.5 4-8-7 4-.5L13 4Z" fill="currentColor" />
  </svg>
);

export const NoScopeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M5 19 19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SmokeKillIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M6 16a4 4 0 0 1 .5-7.97A5.5 5.5 0 0 1 17 7.6 4.2 4.2 0 0 1 18 16H6Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12.5" r="1.6" fill="currentColor" />
  </svg>
);

export const BlindIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="2" />
    <path d="M4 20 20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const AirborneIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="m7 9 5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 18c2 1.4 4.5 2 7 2s5-.6 7-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const FlashAssistIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13 2 5 13.5h5L9 22l9-12h-5.5L13 2Z" fill="currentColor" />
  </svg>
);

export const BombIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="14" r="7" fill="currentColor" />
    <rect x="13" y="4.6" width="5" height="3" rx="1" transform="rotate(35 13 4.6)" fill="currentColor" />
    <path d="m18.5 3 2 .8-.8 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const TimerIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M12 9v4l3 2M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PingIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="14" width="3" height="6" rx="1" fill="currentColor" opacity="0.45" />
    <rect x="10.5" y="10" width="3" height="10" rx="1" fill="currentColor" opacity="0.7" />
    <rect x="17" y="5" width="3" height="15" rx="1" fill="currentColor" />
  </svg>
);

export const CoachIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8h9a5 5 0 0 1 0 10h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="3" y="6" width="4" height="6" rx="1.4" fill="currentColor" />
    <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PauseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="6" y="4" width="4.4" height="16" rx="1.2" fill="currentColor" />
    <rect x="13.6" y="4" width="4.4" height="16" rx="1.2" fill="currentColor" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="m12 2.5 2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95L12 2.5Z"
      fill="currentColor"
    />
  </svg>
);

export const ReplayIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 1 2.4 5.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 18v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CameraIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="m16 11 5-3v9l-5-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" />
  </svg>
);

export const FireIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M12 22c-4 0-7-2.9-7-6.8 0-3 2-5.1 3.5-7C9.7 6.7 10.5 5 10.5 3c3 1.5 4 4.4 3.7 6.5.8-.4 1.5-1.2 1.8-2.3C18.3 9 19 11.4 19 15.2 19 19.1 16 22 12 22Z"
      fill="currentColor"
    />
  </svg>
);

/* ------------------------------- roles -------------------------------- */

export const IGLIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 17 6 8l4 3 2-6 2 6 4-3 2 9H4Z" fill="currentColor" />
    <rect x="4" y="18.5" width="16" height="2" rx="1" fill="currentColor" />
  </svg>
);

export const AWPerIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M12 4v5M12 15v5M4 12h5M15 12h5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const EntryIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="m11 6 6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 4v16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const SupportIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const AnchorIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="6" r="2.4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8.5V20M5 13c0 4 3.5 7 7 7s7-3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8.5 11.5h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const LurkerIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 12.5A8.5 8.5 0 1 1 11.5 4a6.6 6.6 0 0 0 8.5 8.5Z" fill="currentColor" />
  </svg>
);
