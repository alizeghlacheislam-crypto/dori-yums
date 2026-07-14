import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Player } from 'csgogsi';
import styles from './Players.module.css';
import { usePlayerStats } from '../../hooks/useMatchStats';
import { money, pct, ratio } from '../../utils/format';
import { activeWeapon, grenades } from '../../utils/weapons';
import { initials, playerRole } from '../../utils/players';
import { Flag } from '../shared/Flag';
import { WeaponIcon, WeaponLabel } from '../shared/WeaponIcon';
import { ArmorIcon, DefuseKitIcon, HealthIcon, HelmetIcon, StarIcon } from '../shared/Icons';
import { slideUp } from '../../animations';

const Stat = memo(function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.obsStat}>
      <span className={`${styles.obsStatValue} mono`}>{value}</span>
      <span className={styles.obsStatLabel}>{label}</span>
    </div>
  );
});

/**
 * Expanded spotlight card for the player currently on the observer's camera:
 * identity, loadout and the full statistical read (ADR/KAST/HS%/rating/...).
 */
export const ObservedPlayer = memo(function ObservedPlayer({ player }: { player: Player }) {
  const stats = usePlayerStats(player.steamid);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const active = activeWeapon(player.weapons);
  const nades = grenades(player.weapons);
  const role = playerRole(player);

  return (
    <motion.div
      className={styles.observed}
      data-side={player.team.side}
      variants={slideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <div className={styles.obsIdentity}>
        <div className={styles.obsAvatarBox}>
          {player.avatar && !avatarFailed ? (
            <img src={player.avatar} alt="" className={styles.obsAvatar} onError={() => setAvatarFailed(true)} />
          ) : (
            <span className={styles.obsAvatarFallback}>{initials(player.name)}</span>
          )}
        </div>
        <div>
          <div className={styles.obsNameRow}>
            <Flag country={player.country} height={13} />
            <span className={styles.obsName}>{player.name}</span>
            {role && <span className={styles.obsRole}>{role.toUpperCase()}</span>}
          </div>
          {player.realName && <span className={styles.obsRealName}>{player.realName}</span>}
          <div className={styles.obsVitals}>
            <span className={styles.obsVital}>
              <HealthIcon size={11} /> <span className="mono">{player.state.health}</span>
            </span>
            <span className={styles.obsVital}>
              {player.state.helmet ? <HelmetIcon size={11} /> : <ArmorIcon size={11} />}{' '}
              <span className="mono">{player.state.armor}</span>
            </span>
            {player.state.defusekit && (
              <span className={styles.obsVital}>
                <DefuseKitIcon size={11} />
              </span>
            )}
            <span className={`${styles.obsVital} mono`}>{money(player.state.money)}</span>
            {player.stats.mvps > 0 && (
              <span className={styles.obsVital}>
                <StarIcon size={10} /> <span className="mono">{player.stats.mvps}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.obsStats}>
        <Stat label="K" value={String(player.stats.kills)} />
        <Stat label="A" value={String(player.stats.assists)} />
        <Stat label="D" value={String(player.stats.deaths)} />
        <Stat label="ADR" value={String(Math.round(stats.adr))} />
        <Stat label="KAST" value={pct(stats.kast)} />
        <Stat label="HS" value={pct(stats.hsPercent)} />
        <Stat label="UD" value={String(Math.round(stats.utilityDamage))} />
        <Stat label="FA" value={String(stats.flashAssists)} />
        <Stat label="RATING" value={ratio(stats.rating)} />
      </div>

      <div className={styles.obsLoadout}>
        {active && (
          <div className={styles.obsWeapon}>
            <WeaponIcon name={active.name} height={20} />
            <div className={styles.obsWeaponText}>
              <span className={styles.obsWeaponName}>
                <WeaponLabel name={active.name} />
              </span>
              {typeof active.ammo_clip === 'number' && (
                <span className={`${styles.obsAmmo} mono`}>
                  {active.state === 'reloading' ? 'RELOADING' : `${active.ammo_clip} / ${active.ammo_reserve ?? 0}`}
                </span>
              )}
            </div>
          </div>
        )}
        {nades.length > 0 && (
          <div className={styles.obsNades}>
            {nades.map(n => (
              <WeaponIcon key={n.id} name={n.name} height={13} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});
