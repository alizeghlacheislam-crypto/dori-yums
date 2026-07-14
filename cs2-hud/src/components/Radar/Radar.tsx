import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './Radar.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { mapConfig, toRadar } from '../../utils/maps';
import { fade } from '../../animations';
import type { Grenade, Player } from 'csgogsi';

const VIEW = 1024;

/** Forward vector → radar-space rotation (radar Y axis is inverted). */
function viewAngle(forward: number[]): number {
  return (Math.atan2(-(forward[1] ?? 0), forward[0] ?? 1) * 180) / Math.PI + 90;
}

const PlayerDot = memo(function PlayerDot({
  player,
  x,
  y,
  dimmed
}: {
  player: Player;
  x: number;
  y: number;
  dimmed: boolean;
}) {
  const alive = player.state.health > 0;
  const angle = viewAngle(player.forward);
  if (!alive) {
    return (
      <g transform={`translate(${x} ${y})`} className={styles.deadDot} data-side={player.team.side}>
        <path d="M-9 -9 L9 9 M9 -9 L-9 9" strokeWidth={4} />
      </g>
    );
  }
  return (
    // Position updates ride a CSS transform transition — GSI ticks arrive a
    // few times a second and the browser tween keeps motion silky at 60fps.
    <g
      className={styles.playerDot}
      data-side={player.team.side}
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: dimmed ? 0.3 : 1 }}
    >
      <g transform={`rotate(${angle})`}>
        <path className={styles.cone} d="M0 0 L-26 -44 A52 52 0 0 1 26 -44 Z" />
      </g>
      <circle r={11} className={styles.dotBody} />
      <text y={4} textAnchor="middle" className={styles.dotLabel}>
        {player.observer_slot === 0 ? 10 : (player.observer_slot ?? '')}
      </text>
      {player.state.flashed > 40 && <circle r={11} className={styles.dotFlash} />}
    </g>
  );
});

function GrenadeMark({ grenade, cfg }: { grenade: Grenade; cfg: ReturnType<typeof mapConfig> }) {
  if (grenade.type === 'inferno') {
    return (
      <g className={styles.inferno}>
        {grenade.flames.map(f => {
          const p = toRadar(cfg, f.position);
          return <circle key={f.id} cx={p.x} cy={p.y} r={9} />;
        })}
      </g>
    );
  }
  const p = toRadar(cfg, grenade.position);
  if (grenade.type === 'smoke') {
    // Smokes bloom to full size, then fade over their ~18s lifetime.
    const grow = Math.min(1, grenade.effecttime / 1.5);
    const fadeOut = grenade.effecttime > 15 ? Math.max(0, 1 - (grenade.effecttime - 15) / 3) : 1;
    return <circle className={styles.smoke} cx={p.x} cy={p.y} r={30 * grow} style={{ opacity: 0.65 * fadeOut }} />;
  }
  const cls =
    grenade.type === 'flashbang'
      ? styles.flashNade
      : grenade.type === 'firebomb'
        ? styles.fireNade
        : grenade.type === 'decoy'
          ? styles.decoyNade
          : styles.heNade;
  return <circle className={cls} cx={p.x} cy={p.y} r={7} />;
}

/**
 * Fully vector radar: stylised grid plane, bombsite markers, player dots with
 * view cones, live grenades, the bomb, and level-awareness on two-tier maps.
 */
export const Radar = memo(function Radar({ size }: { size: number }) {
  const { game, observed } = useHUD();
  const cfg = useMemo(() => mapConfig(game?.map.name ?? ''), [game?.map.name]);
  if (!game) return null;

  const observedZ = observed && observed.position.length > 2 ? observed.position[2] : null;
  const splitZ = cfg.levels?.splitZ ?? null;
  const focusLower = splitZ !== null && observedZ !== null ? observedZ < splitZ : null;

  const isDimmed = (pos: number[]): boolean => {
    if (splitZ === null || focusLower === null || pos.length < 3) return false;
    return (pos[2] < splitZ) !== focusLower;
  };

  const siteA = toRadar(cfg, [cfg.sites.A.x, cfg.sites.A.y]);
  const siteB = toRadar(cfg, [cfg.sites.B.x, cfg.sites.B.y]);
  const bomb = game.bomb;
  const bombPos = bomb && bomb.position.length >= 2 ? toRadar(cfg, bomb.position) : null;
  const bombVisible = bomb && bomb.state !== 'carried' && bombPos;

  return (
    <motion.div
      className={styles.radar}
      style={{ width: size, height: size }}
      variants={fade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className={styles.svg}>
        <defs>
          <pattern id="radar-grid" width={64} height={64} patternUnits="userSpaceOnUse">
            <path d="M64 0H0V64" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
          </pattern>
        </defs>
        <rect width={VIEW} height={VIEW} fill="rgba(11,13,17,0.55)" />
        <rect width={VIEW} height={VIEW} fill="url(#radar-grid)" />

        {/* bombsites / plant zones */}
        {(
          [
            ['A', siteA],
            ['B', siteB]
          ] as const
        ).map(([label, p]) => (
          <g key={label} transform={`translate(${p.x} ${p.y})`} className={styles.site}>
            <rect x={-36} y={-36} width={72} height={72} rx={10} />
            <text y={13} textAnchor="middle">
              {label}
            </text>
          </g>
        ))}

        {/* utility */}
        {game.grenades.map(grenade => (
          <GrenadeMark key={grenade.id} grenade={grenade} cfg={cfg} />
        ))}

        {/* the bomb: dropped, planted or being defused */}
        {bombVisible && (
          <g transform={`translate(${bombPos.x} ${bombPos.y})`} className={styles.bomb} data-state={bomb.state}>
            {(bomb.state === 'planted' || bomb.state === 'defusing') && <circle r={26} className={styles.bombPulse} />}
            <rect x={-9} y={-9} width={18} height={18} rx={3} />
            <text y={4.5} textAnchor="middle">
              C4
            </text>
          </g>
        )}

        {/* players (dead first so living dots render on top) */}
        {[...game.players]
          .sort((a, b) => Number(a.state.health > 0) - Number(b.state.health > 0))
          .map(player => {
            if (player.position.length < 2) return null;
            const p = toRadar(cfg, player.position);
            return <PlayerDot key={player.steamid} player={player} x={p.x} y={p.y} dimmed={isDimmed(player.position)} />;
          })}
      </svg>

      {splitZ !== null && focusLower !== null && (
        <span className={styles.levelTag}>{focusLower ? 'LOWER' : 'UPPER'}</span>
      )}
    </motion.div>
  );
});
