import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './PlayerCard.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Avatar } from '@/components/shared/Avatar';
import { Flag } from '@/components/shared/Flag';
import { HealthBar } from '@/components/shared/HealthBar';
import { RoleIcon } from '@/components/shared/RoleIcon';
import { WeaponIcon } from '@/assets/weapons/WeaponIcon';
import {
  ArmorIcon,
  BombIcon,
  DefuseKitIcon,
  HelmetIcon,
  ReloadIcon,
  ScopeIcon,
  SkullIcon,
  StarIcon,
} from '@/assets/icons/Icons';
import { usePulse } from '@/hooks/usePulse';
import { useConfig } from '@/contexts/ConfigContext';
import { formatMoney } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Player } from '@/types/hud';

const DEFUSE_WITH_KIT_S = 5;
const DEFUSE_WITHOUT_KIT_S = 10;

export interface PlayerCardProps {
  player: Player;
  orientation: 'left' | 'right';
  /** remaining bomb countdown, needed for the defuse progress strip */
  bombCountdown?: number;
}

/**
 * One player row of the side panels. Everything visible is state-driven:
 * flash/damage/fire overlays, plant & defuse progress, weapon swaps,
 * money pulses and the dead state all react to GSI deltas.
 */
export const PlayerCard = memo(({ player, orientation, bombCountdown }: PlayerCardProps) => {
  const config = useConfig();
  const damagePulse = usePulse(player.health, 650, 'down');
  const moneyPulse = usePulse(player.money, 600);

  const sideColor = player.side === 'CT' ? 'var(--ct)' : 'var(--t)';
  const active = player.activeWeapon;

  // Defuse progress: countdown ticks toward 0 over the full defuse time.
  const defuseTotal = player.defuseKit ? DEFUSE_WITH_KIT_S : DEFUSE_WITHOUT_KIT_S;
  const defuseProgress =
    player.isDefusing && bombCountdown !== undefined
      ? Math.max(0, Math.min(1, 1 - bombCountdown / defuseTotal))
      : 0;

  return (
    <GlassPanel
      className={cn(
        styles.card,
        orientation === 'right' && styles.right,
        !player.alive && styles.dead,
        player.isObserved && styles.observed,
      )}
      accent={orientation === 'left' ? 'left' : 'right'}
      accentColor={sideColor}
    >
      <Avatar
        steamid={player.steamid}
        url={player.avatar}
        name={player.name}
        size={44}
        dead={!player.alive}
      />

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <Flag country={player.country} size={12} />
          <span className={styles.name}>{player.name}</span>
          {config.modules.showPlayerRoles && player.role && (
            <span className={styles.roleBadge} title={player.role}>
              <RoleIcon role={player.role} size={11} />
            </span>
          )}
          {player.stats.mvps > 0 && (
            <span className={styles.mvpStars} title={`${player.stats.mvps} MVPs`}>
              <StarIcon size={9} />
              {player.stats.mvps}
            </span>
          )}
          {player.computed.currentKillStreak >= 3 && player.alive && (
            <motion.span
              className={styles.streakBadge}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22 }}
            >
              {player.computed.currentKillStreak} STREAK
            </motion.span>
          )}
          <span className={cn(styles.money, moneyPulse && styles.moneyPulse)}>
            {formatMoney(player.money)}
          </span>
        </div>

        {player.alive ? (
          <>
            <div className={styles.hpRow}>
              <span className={styles.hpValue}>{player.health}</span>
              <div className={styles.hpBar}>
                <HealthBar value={player.health} />
              </div>
              <span className={styles.gearIcons}>
                {player.helmet ? (
                  <HelmetIcon size={11} className={styles.gearActive} />
                ) : (
                  player.armor > 0 && <ArmorIcon size={11} className={styles.gearActive} />
                )}
                {player.defuseKit && <DefuseKitIcon size={11} className={styles.kitIcon} />}
                {player.hasBomb && <BombIcon size={11} className={styles.bombCarrier} />}
              </span>
            </div>
            <div className={styles.statsRow}>
              <span className={styles.statItem}>
                K <b>{player.stats.kills}</b>
              </span>
              <span className={styles.statItem}>
                A <b>{player.stats.assists}</b>
              </span>
              <span className={styles.statItem}>
                D <b>{player.stats.deaths}</b>
              </span>
              <span className={styles.statItem}>
                ADR <b>{Math.round(player.computed.adr)}</b>
              </span>
              <span className={styles.statItem}>
                HS <b>{Math.round(player.computed.headshotPct * 100)}%</b>
              </span>
            </div>
          </>
        ) : (
          <div className={styles.deadCenter}>
            <SkullIcon size={13} />
            <span className={styles.deadStats}>
              {player.stats.kills} / {player.stats.deaths} · ADR {Math.round(player.computed.adr)} ·
              KAST {Math.round(player.computed.kast * 100)}%
            </span>
          </div>
        )}
      </div>

      {player.alive && (
        <div className={styles.weapons}>
          <div className={styles.activeWeapon}>
            {player.isReloading ? (
              <ReloadIcon size={11} />
            ) : (
              player.isScoped && <ScopeIcon size={11} />
            )}
            {active && active.category !== 'grenade' && (
              <WeaponIcon weaponId={active.id} size={17} title={active.displayName} />
            )}
            {active && active.ammoClipMax > 0 && (
              <span className={styles.ammo}>
                {active.ammoClip}
                <span className={styles.ammoReserve}>/{active.ammoReserve}</span>
              </span>
            )}
          </div>
          <div className={styles.holstered}>
            {player.primaryWeapon && player.primaryWeapon.id !== active?.id && (
              <WeaponIcon weaponId={player.primaryWeapon.id} size={13} />
            )}
            {player.secondaryWeapon && player.secondaryWeapon.id !== active?.id && (
              <WeaponIcon weaponId={player.secondaryWeapon.id} size={13} />
            )}
          </div>
          <div className={styles.nades}>
            {player.grenades.map((g, i) => (
              <WeaponIcon key={`${g.id}-${i}`} weaponId={g.id} size={12} title={g.displayName} />
            ))}
          </div>
        </div>
      )}

      {/* status overlays ------------------------------------------- */}
      {player.alive && player.flashed > 8 && (
        <div className={styles.flashOverlay} style={{ opacity: (player.flashed / 255) * 0.6 }} />
      )}
      {player.alive && player.smoked > 40 && <div className={styles.smokeOverlay} />}
      <AnimatePresence>
        {damagePulse && player.alive && (
          <motion.div
            className={styles.damageOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
        {player.alive && player.burning > 0 && (
          <motion.div
            className={styles.burnOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
        {(player.isPlanting || player.isDefusing) && (
          <motion.div
            className={cn(styles.actionStrip, player.isDefusing && styles.actionDefuse)}
            initial={{ y: 15 }}
            animate={{ y: 0 }}
            exit={{ y: 15 }}
            transition={{ duration: 0.2 }}
          >
            {player.isDefusing ? (
              <div className={styles.actionFill} style={{ width: `${defuseProgress * 100}%` }} />
            ) : (
              // Plant duration isn't in GSI — run a timed sweep instead.
              <motion.div
                className={styles.actionFill}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.1, ease: 'linear' }}
              />
            )}
            <span className={styles.actionLabel}>
              {player.isDefusing ? 'DEFUSING' : 'PLANTING'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
});
PlayerCard.displayName = 'PlayerCard';
