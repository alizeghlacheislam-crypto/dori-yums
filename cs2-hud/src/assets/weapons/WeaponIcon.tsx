import { memo } from 'react';

/**
 * Original, broadcast-clean weapon silhouettes.
 *
 * Guns are assembled from a parameterized silhouette spec (receiver,
 * barrel, stock, scope, magazine, grip) on a 64×24 canvas — this keeps
 * all ~35 firearms visually consistent and instantly readable at HUD
 * sizes, while every weapon still gets a distinct profile. Equipment
 * (grenades, knife, zeus, C4) uses dedicated hand-drawn paths.
 */

interface GunSpec {
  /** barrel length beyond the receiver (px) */
  barrel: number;
  /** barrel thickness */
  barrelH?: number;
  /** receiver [x, width, height] */
  body: [number, number, number];
  stock: 'none' | 'full' | 'skeleton' | 'pad' | 'wire';
  scope: 'none' | 'iron' | 'small' | 'big';
  mag: 'none' | 'straight' | 'curved' | 'long' | 'drum' | 'box';
  /** silencer tip */
  silencer?: boolean;
  /** pump / foregrip under the barrel */
  foregrip?: boolean;
  /** pistol proportions (short, raised grip) */
  pistol?: boolean;
}

const GUN_SPECS: Record<string, GunSpec> = {
  // Pistols
  glock: { barrel: 8, body: [22, 16, 7], stock: 'none', scope: 'none', mag: 'none', pistol: true },
  usp_silencer: { barrel: 6, body: [24, 14, 7], stock: 'none', scope: 'none', mag: 'none', pistol: true, silencer: true },
  hkp2000: { barrel: 7, body: [23, 15, 7], stock: 'none', scope: 'none', mag: 'none', pistol: true },
  p250: { barrel: 6, body: [23, 14, 7], stock: 'none', scope: 'none', mag: 'none', pistol: true },
  elite: { barrel: 9, body: [21, 15, 7], stock: 'none', scope: 'none', mag: 'none', pistol: true },
  fiveseven: { barrel: 7, body: [23, 15, 8], stock: 'none', scope: 'none', mag: 'none', pistol: true },
  tec9: { barrel: 10, body: [21, 14, 8], stock: 'none', scope: 'none', mag: 'straight', pistol: true },
  cz75a: { barrel: 7, body: [22, 15, 7], stock: 'none', scope: 'none', mag: 'straight', pistol: true },
  deagle: { barrel: 12, body: [20, 17, 8], stock: 'none', scope: 'none', mag: 'none', pistol: true },
  revolver: { barrel: 11, body: [20, 15, 9], stock: 'none', scope: 'none', mag: 'none', pistol: true },
  // SMGs
  mac10: { barrel: 6, body: [18, 20, 10], stock: 'wire', scope: 'none', mag: 'long' },
  mp9: { barrel: 7, body: [18, 19, 9], stock: 'skeleton', scope: 'iron', mag: 'straight' },
  mp7: { barrel: 6, body: [18, 20, 9], stock: 'pad', scope: 'small', mag: 'long' },
  mp5sd: { barrel: 12, body: [18, 18, 8], stock: 'skeleton', scope: 'iron', mag: 'curved', silencer: true },
  ump45: { barrel: 9, body: [17, 19, 9], stock: 'skeleton', scope: 'iron', mag: 'curved' },
  p90: { barrel: 8, body: [14, 26, 11], stock: 'none', scope: 'small', mag: 'none' },
  bizon: { barrel: 10, body: [16, 19, 8], stock: 'skeleton', scope: 'iron', mag: 'drum' },
  // Rifles
  famas: { barrel: 12, body: [14, 22, 9], stock: 'full', scope: 'iron', mag: 'curved' },
  galilar: { barrel: 13, body: [14, 21, 8], stock: 'skeleton', scope: 'iron', mag: 'curved' },
  m4a4: { barrel: 14, body: [13, 21, 8], stock: 'pad', scope: 'iron', mag: 'curved', foregrip: true },
  m4a1_silencer: { barrel: 10, body: [13, 21, 8], stock: 'pad', scope: 'iron', mag: 'curved', silencer: true },
  ak47: { barrel: 13, body: [13, 22, 8], stock: 'full', scope: 'iron', mag: 'curved' },
  aug: { barrel: 12, body: [14, 23, 10], stock: 'full', scope: 'big', mag: 'curved' },
  sg556: { barrel: 13, body: [14, 22, 9], stock: 'full', scope: 'big', mag: 'curved' },
  // Snipers
  ssg08: { barrel: 16, body: [12, 20, 7], stock: 'full', scope: 'big', mag: 'none' },
  awp: { barrel: 17, body: [11, 21, 8], stock: 'full', scope: 'big', mag: 'box' },
  scar20: { barrel: 15, body: [12, 21, 9], stock: 'pad', scope: 'big', mag: 'box' },
  g3sg1: { barrel: 15, body: [12, 21, 9], stock: 'full', scope: 'big', mag: 'box' },
  // Shotguns
  nova: { barrel: 15, body: [13, 19, 8], stock: 'full', scope: 'none', mag: 'none', foregrip: true },
  xm1014: { barrel: 13, body: [13, 20, 9], stock: 'full', scope: 'none', mag: 'none', foregrip: true },
  sawedoff: { barrel: 11, body: [16, 18, 9], stock: 'none', scope: 'none', mag: 'none', foregrip: true },
  mag7: { barrel: 10, body: [15, 19, 9], stock: 'pad', scope: 'none', mag: 'box', foregrip: true },
  // Machine guns
  m249: { barrel: 13, body: [12, 23, 11], stock: 'pad', scope: 'iron', mag: 'drum', foregrip: true },
  negev: { barrel: 12, body: [12, 24, 11], stock: 'pad', scope: 'iron', mag: 'drum', foregrip: true },
};

const Gun = ({ spec }: { spec: GunSpec }) => {
  const [bx, bw, bh] = spec.body;
  const baseY = spec.pistol ? 8 : 7;
  const bodyTop = baseY;
  const bodyBottom = bodyTop + bh;
  const barrelY = bodyTop + Math.max(1, Math.floor(bh / 3));
  const barrelH = spec.barrelH ?? (spec.pistol ? 3 : 3);
  const barrelEndX = bx + bw + spec.barrel;

  return (
    <g fill="currentColor">
      {/* receiver */}
      <rect x={bx} y={bodyTop} width={bw} height={bh} rx={1.5} />
      {/* barrel */}
      <rect x={bx + bw - 1} y={barrelY} width={spec.barrel + 1} height={barrelH} rx={1} />
      {spec.silencer && (
        <rect x={barrelEndX - 1} y={barrelY - 1} width={9} height={barrelH + 2} rx={2} />
      )}
      {/* stock */}
      {spec.stock === 'full' && (
        <path
          d={`M ${bx} ${bodyTop + 1} L ${bx - 9} ${bodyTop + 3} L ${bx - 10} ${bodyBottom + 1} L ${bx - 5} ${bodyBottom + 1} L ${bx} ${bodyBottom - 2} Z`}
        />
      )}
      {spec.stock === 'skeleton' && (
        <>
          <rect x={bx - 9} y={bodyTop + 1} width={10} height={2.4} rx={1} />
          <rect x={bx - 9} y={bodyTop + 1} width={2.4} height={bh - 1} rx={1} />
          <rect x={bx - 9} y={bodyBottom - 2.4} width={10} height={2.4} rx={1} />
        </>
      )}
      {spec.stock === 'pad' && <rect x={bx - 7} y={bodyTop + 1} width={8} height={bh - 1} rx={2} />}
      {spec.stock === 'wire' && (
        <>
          <rect x={bx - 8} y={bodyTop + 2} width={9} height={2} rx={1} />
          <rect x={bx - 8} y={bodyTop + 2} width={2} height={bh - 3} rx={1} />
        </>
      )}
      {/* optics */}
      {spec.scope === 'iron' && <rect x={bx + bw - 4} y={bodyTop - 2.5} width={3} height={3} rx={0.5} />}
      {spec.scope === 'small' && (
        <rect x={bx + Math.floor(bw / 3)} y={bodyTop - 4} width={10} height={3.4} rx={1.6} />
      )}
      {spec.scope === 'big' && (
        <>
          <rect x={bx + 3} y={bodyTop - 5} width={Math.max(14, bw - 6)} height={4} rx={2} />
          <rect x={bx + 1} y={bodyTop - 5.5} width={3} height={5} rx={1} />
          <rect x={bx + Math.max(14, bw - 6) + 1} y={bodyTop - 5.5} width={3} height={5} rx={1} />
        </>
      )}
      {/* magazine */}
      {spec.mag === 'straight' && (
        <rect x={bx + bw / 2 - 2} y={bodyBottom - 1} width={4.5} height={7} rx={1} />
      )}
      {spec.mag === 'long' && (
        <rect x={bx + bw / 2 - 2} y={bodyBottom - 1} width={4.5} height={9.5} rx={1} />
      )}
      {spec.mag === 'curved' && (
        <path
          d={`M ${bx + bw / 2 - 2.5} ${bodyBottom - 1} h 5.5 q 0.5 5 -2 8 h -5.5 q -0.5 -5.5 2 -8 Z`}
        />
      )}
      {spec.mag === 'box' && (
        <rect x={bx + bw / 2 - 3} y={bodyBottom - 1} width={7} height={6} rx={1} />
      )}
      {spec.mag === 'drum' && (
        <circle cx={bx + bw / 2} cy={bodyBottom + 3.5} r={4.5} />
      )}
      {/* grip */}
      <path
        d={`M ${bx + bw - (spec.pistol ? 4 : 6)} ${bodyBottom - 1} l 4.5 0 l -1.5 ${spec.pistol ? 8 : 7} l -4.5 0 Z`}
      />
      {/* foregrip / pump */}
      {spec.foregrip && (
        <rect x={bx + bw + Math.min(4, spec.barrel - 5)} y={barrelY + barrelH - 0.5} width={7} height={4} rx={1.5} />
      )}
    </g>
  );
};

/* Dedicated equipment paths ---------------------------------------- */

const KnifeIcon = () => (
  <g fill="currentColor">
    <path d="M 12 16 Q 30 4 50 7 Q 38 15 26 16.5 L 22 16.5 Z" />
    <rect x="12" y="16.5" width="12" height="3.4" rx="1.6" transform="rotate(-4 12 17)" />
  </g>
);

const TaserIcon = () => (
  <g fill="currentColor">
    <rect x="20" y="8" width="18" height="8" rx="2" />
    <path d="M 38 9.5 l 6 2.5 l -6 2.5 Z" />
    <path d="M 24 16 l 3 0 l -1 7 l -4 0 Z" />
    <path d="M 46 7 l 2.4 3 l -1.8 0.4 l 2.6 3.4 l -4.4 -2.4 l 1.8 -0.6 Z" />
  </g>
);

const C4Icon = () => (
  <g fill="currentColor">
    <rect x="20" y="7" width="22" height="12" rx="1.5" />
    <rect x="23" y="9.5" width="9" height="4" rx="0.8" fill="#0b0d11" />
    <circle cx="37.5" cy="11.5" r="1.6" fill="#0b0d11" />
    <path d="M 24 7 q 4 -5 8 0 q 3 -4 6 0" stroke="currentColor" strokeWidth="1.6" fill="none" />
  </g>
);

const HEIcon = () => (
  <g fill="currentColor">
    <circle cx="31" cy="14" r="7.5" />
    <path d="M 31 14 m -7.5 0 a 7.5 7.5 0 0 1 15 0" fill="none" stroke="#0b0d11" strokeWidth="0.9" />
    <rect x="28.5" y="3.5" width="5" height="4" rx="1" />
    <path d="M 33.5 4 l 6 -1.6 l 0.8 2.6 l -5.6 1.4 Z" />
  </g>
);

const FlashIcon = () => (
  <g fill="currentColor">
    <rect x="26" y="5" width="10" height="15" rx="4" />
    <rect x="28" y="2.5" width="6" height="3.4" rx="1" />
    <path d="M 40 8 l 3.6 -2.2 M 41 13 l 4.2 0 M 40 17.5 l 3.6 2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
  </g>
);

const SmokeIcon = () => (
  <g fill="currentColor">
    <rect x="25" y="6" width="12" height="14" rx="2.5" />
    <rect x="27.5" y="3" width="7" height="3.6" rx="1" />
    <path d="M 25 11 h 12 M 25 15 h 12" stroke="#0b0d11" strokeWidth="1" />
  </g>
);

const MolotovIcon = () => (
  <g fill="currentColor">
    <path d="M 27 10 q -3 4 -3 7 a 7 7 0 0 0 14 0 q 0 -3 -3 -7 Z" />
    <rect x="29" y="5.5" width="4" height="5.5" rx="1" />
    <path d="M 30 5.5 q 1 -3 3.6 -3.6 q -0.6 2.4 0.6 3.6 Z" />
  </g>
);

const IncendiaryIcon = () => (
  <g fill="currentColor">
    <circle cx="31" cy="15" r="6.5" />
    <path d="M 31 2.5 q 3.5 3.5 1.2 6.5 q 3 -0.6 3.6 -3 q 2.6 4.6 -1.4 7.2 l -7.4 0 q -3 -4.6 4 -10.7 Z" />
  </g>
);

const DecoyIcon = () => (
  <g fill="currentColor">
    <rect x="26" y="7" width="10" height="13" rx="4.5" />
    <rect x="28" y="4.5" width="6" height="3" rx="1" />
    <path d="M 41 9 a 6 6 0 0 1 0 8 M 44 7 a 9.5 9.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </g>
);

const EQUIPMENT: Record<string, () => JSX.Element> = {
  knife: KnifeIcon,
  taser: TaserIcon,
  c4: C4Icon,
  hegrenade: HEIcon,
  flashbang: FlashIcon,
  smokegrenade: SmokeIcon,
  molotov: MolotovIcon,
  incgrenade: IncendiaryIcon,
  decoy: DecoyIcon,
};

export interface WeaponIconProps {
  weaponId: string;
  className?: string;
  /** height in px; width follows the 64:24 aspect */
  size?: number;
  title?: string;
}

export const WeaponIcon = memo(({ weaponId, className, size = 20, title }: WeaponIconProps) => {
  const Equipment = EQUIPMENT[weaponId];
  const spec = GUN_SPECS[weaponId];
  return (
    <svg
      viewBox="0 0 64 26"
      className={className}
      style={{ height: size, width: (size / 26) * 64, display: 'block' }}
      role="img"
      aria-label={title ?? weaponId}
    >
      {Equipment ? <Equipment /> : spec ? <Gun spec={spec} /> : <Gun spec={GUN_SPECS.hkp2000} />}
    </svg>
  );
});
WeaponIcon.displayName = 'WeaponIcon';
