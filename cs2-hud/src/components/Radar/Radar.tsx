import { memo, useState } from 'react';
import styles from './Radar.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { useGSI } from '@/contexts/GSIContext';
import { useConfig } from '@/contexts/ConfigContext';
import { mapConfig, mapDisplayName, worldToRadar } from '@/utils/maps';
import { yawOf } from '@/utils/vector';
import type { GrenadeInfo, Player } from '@/types/hud';

const VIEW = 100; // SVG viewBox units

/**
 * Custom SVG radar rendered from GSI positions. A grayscale overview
 * image is used when `public/maps/<map>.png` exists; otherwise players
 * move over a designed grid so the module never breaks. Multi-level maps
 * fade entities on the other level from the observed player.
 */
export const Radar = memo(() => {
  const { players, observed, bomb, grenades, match } = useGSI();
  const config = useConfig();
  const [mapImageOk, setMapImageOk] = useState(true);

  if (!config.modules.showRadar) return null;
  const cfg = mapConfig(match.mapName);
  if (!cfg || match.mapName === '') return null;

  const size = config.layout.radarSize;
  const observedZ = observed?.position[2] ?? 0;

  const toXY = (pos: readonly [number, number, number]) => {
    const { u, v } = worldToRadar(cfg, pos);
    return { x: u * VIEW, y: v * VIEW };
  };

  // On split-level maps, entities on the observed player's level render
  // solid; the other level fades back.
  const levelOpacity = (z: number): number => {
    if (cfg.splitZ === undefined) return 1;
    const sameLevel = (z < cfg.splitZ) === (observedZ < cfg.splitZ);
    return sameLevel ? 1 : 0.35;
  };

  const siteA = toXY([cfg.siteA[0], cfg.siteA[1], 0]);
  const siteB = toXY([cfg.siteB[0], cfg.siteB[1], 0]);

  return (
    <GlassPanel className={styles.root}>
      <div className={styles.header}>
        <span>{mapDisplayName(match.mapName)}</span>
        <span>RADAR</span>
      </div>
      <div className={styles.stage} style={{ width: size, height: size }}>
        {mapImageOk && (
          <img
            className={styles.mapImage}
            src={`./maps/${match.mapName.replace(/^.*\//, '')}.png`}
            alt=""
            onError={() => setMapImageOk(false)}
          />
        )}
        <svg className={styles.svg} viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size}>
          <text className={styles.siteLabel} x={siteA.x} y={siteA.y}>A</text>
          <text className={styles.siteLabel} x={siteB.x} y={siteB.y}>B</text>

          {grenades.map((g) => (
            <RadarGrenade key={g.id} grenade={g} toXY={toXY} levelOpacity={levelOpacity} />
          ))}

          {players.map((p) => (
            <RadarPlayer key={p.steamid} player={p} toXY={toXY} levelOpacity={levelOpacity} />
          ))}

          {bomb && bomb.state !== 'carried' && bomb.state !== 'defused' && bomb.state !== 'exploded' && (
            <g
              className={styles.player}
              style={{ transform: `translate(${toXY(bomb.position).x}px, ${toXY(bomb.position).y}px)` }}
            >
              <circle
                className={`${styles.bombGlyph} ${bomb.state === 'planted' || bomb.state === 'defusing' ? styles.pulse : ''}`}
                r={1.7}
                fill="var(--primary)"
              />
              <text className={styles.slotLabel} y={0.1} fill="#fff">C4</text>
            </g>
          )}
        </svg>
      </div>
    </GlassPanel>
  );
});
Radar.displayName = 'Radar';

/* ------------------------------------------------------------------ */

interface Projection {
  toXY: (pos: readonly [number, number, number]) => { x: number; y: number };
  levelOpacity: (z: number) => number;
}

const RadarPlayer = memo(({ player, toXY, levelOpacity }: { player: Player } & Projection) => {
  const { x, y } = toXY(player.position);
  const color = player.side === 'CT' ? 'var(--ct)' : 'var(--t)';

  if (!player.alive) {
    return (
      <g className={styles.player} style={{ transform: `translate(${x}px, ${y}px)` }}>
        <path className={styles.deadMark} d="M -1.6 -1.6 L 1.6 1.6 M 1.6 -1.6 L -1.6 1.6" stroke={color} />
      </g>
    );
  }

  const yaw = -yawOf(player.forward); // SVG y-axis points down
  return (
    <g
      className={styles.player}
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: levelOpacity(player.position[2]) }}
    >
      <path
        className={styles.cone}
        d="M 0 0 L 6.4 -3.6 A 7.4 7.4 0 0 1 6.4 3.6 Z"
        fill={color}
        transform={`rotate(${yaw})`}
      />
      {player.isObserved && <circle className={styles.observedRing} r={3.1} />}
      <circle className={styles.playerDot} r={2.1} fill={color} />
      <text className={styles.slotLabel}>{player.observerSlot}</text>
      {player.hasBomb && <circle r={0.8} cx={1.7} cy={-1.7} fill="var(--primary)" />}
    </g>
  );
});
RadarPlayer.displayName = 'RadarPlayer';

/* ------------------------------------------------------------------ */

const GRENADE_COLORS: Record<string, string> = {
  smoke: 'rgba(200, 208, 218, 0.8)',
  flashbang: '#ffffff',
  frag: '#ff9f43',
  firebomb: '#ff6b35',
  inferno: '#ff6b35',
  decoy: 'rgba(160, 167, 180, 0.8)',
};

const RadarGrenade = memo(({ grenade, toXY, levelOpacity }: { grenade: GrenadeInfo } & Projection) => {
  const color = GRENADE_COLORS[grenade.type] ?? '#fff';

  // Burning ground: draw each flame cluster cell.
  if (grenade.type === 'inferno') {
    return (
      <g>
        {grenade.flames.map((f, i) => {
          const { x, y } = toXY(f);
          return <circle key={i} cx={x} cy={y} r={1.5} fill={color} opacity={0.5 * levelOpacity(f[2])} />;
        })}
      </g>
    );
  }

  const { x, y } = toXY(grenade.position);
  const opacity = levelOpacity(grenade.position[2]);

  // Smoke bloom: pop to full radius when the effect starts.
  if (grenade.type === 'smoke') {
    const active = grenade.effecttime > 0;
    return (
      <circle
        className={styles.player}
        cx={x}
        cy={y}
        r={active ? 4.6 : 1}
        fill={color}
        opacity={(active ? 0.55 : 0.9) * opacity}
      />
    );
  }

  return (
    <circle
      className={styles.player}
      cx={x}
      cy={y}
      r={1}
      fill={grenade.type === 'decoy' ? 'transparent' : color}
      stroke={color}
      strokeWidth={0.4}
      opacity={opacity}
    />
  );
});
RadarGrenade.displayName = 'RadarGrenade';
