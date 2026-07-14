import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ObservedPlayer.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Avatar } from '@/components/shared/Avatar';
import { Flag } from '@/components/shared/Flag';
import { RoleIcon, ROLE_LABELS } from '@/components/shared/RoleIcon';
import { WeaponIcon } from '@/assets/weapons/WeaponIcon';
import { ArmorIcon, HealthIcon, HelmetIcon } from '@/assets/icons/Icons';
import { useGSI } from '@/contexts/GSIContext';
import { slideIn } from '@/animations/variants';

/**
 * Detailed lower-third for the player currently on the observer's
 * camera: identity, vitals, live weapon + ammo, and the full advanced
 * stat line (rating, ADR, KAST, HS%, utility damage, flash assists).
 */
export const ObservedPlayer = memo(() => {
  const { observed } = useGSI();

  return (
    <AnimatePresence mode="wait">
      {observed && observed.alive && (
        <motion.div
          key={observed.steamid}
          variants={slideIn('down', 26)}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <GlassPanel
            className={styles.root}
            accent="top"
            accentColor={observed.side === 'CT' ? 'var(--ct)' : 'var(--t)'}
          >
            <div className={styles.identity}>
              <Avatar
                steamid={observed.steamid}
                url={observed.avatar}
                name={observed.name}
                size={52}
              />
              <div className={styles.names}>
                <div className={styles.nickRow}>
                  <Flag country={observed.country} size={14} />
                  <span className={styles.nick}>{observed.name}</span>
                  {observed.role && (
                    <span className={styles.roleTag}>
                      <RoleIcon role={observed.role} size={10} />
                      {ROLE_LABELS[observed.role]}
                    </span>
                  )}
                </div>
                {observed.realName && <span className={styles.realName}>{observed.realName}</span>}
              </div>
            </div>

            <div className={styles.vitals}>
              <span className={styles.vital}>
                <HealthIcon size={14} className={styles.vitalHp} />
                {observed.health}
              </span>
              <span className={styles.vital}>
                {observed.helmet ? (
                  <HelmetIcon size={14} className={styles.vitalArmor} />
                ) : (
                  <ArmorIcon size={14} className={styles.vitalArmor} />
                )}
                {observed.armor}
              </span>
            </div>

            <div className={styles.weaponBlock}>
              {observed.activeWeapon && (
                <>
                  <WeaponIcon weaponId={observed.activeWeapon.id} size={22} />
                  <span className={styles.weaponName}>{observed.activeWeapon.displayName}</span>
                  {observed.activeWeapon.ammoClipMax > 0 && (
                    <span className={styles.weaponAmmo}>
                      {observed.activeWeapon.ammoClip}
                      <span> / {observed.activeWeapon.ammoReserve}</span>
                    </span>
                  )}
                </>
              )}
            </div>

            <div className={styles.statGrid}>
              <Stat
                label="RATING"
                value={observed.computed.rating.toFixed(2)}
                tone={
                  observed.computed.rating >= 1.1
                    ? 'good'
                    : observed.computed.rating < 0.85
                      ? 'bad'
                      : undefined
                }
              />
              <Stat label="ADR" value={String(Math.round(observed.computed.adr))} />
              <Stat label="KAST" value={`${Math.round(observed.computed.kast * 100)}%`} />
              <Stat label="HS" value={`${Math.round(observed.computed.headshotPct * 100)}%`} />
              <Stat
                label="K / A / D"
                value={`${observed.stats.kills}/${observed.stats.assists}/${observed.stats.deaths}`}
              />
              <Stat label="UTIL DMG" value={String(Math.round(observed.computed.utilityDamage))} />
              <Stat label="FLASH AST" value={String(observed.computed.flashAssists)} />
              <Stat label="TRADES" value={String(observed.computed.tradeKills)} />
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
ObservedPlayer.displayName = 'ObservedPlayer';

const Stat = memo(
  ({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) => (
    <span className={styles.stat}>
      <span
        className={`${styles.statValue} ${
          tone === 'good' ? styles.ratingGood : tone === 'bad' ? styles.ratingBad : ''
        }`}
      >
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </span>
  ),
);
Stat.displayName = 'Stat';
