import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Player } from 'csgogsi';
import styles from './Players.module.css';
import { usePrevious } from '../../hooks/usePrevious';
import { usePlayerStats } from '../../hooks/useMatchStats';
import { useHUD } from '../../contexts/HUDContext';
import { useConfig } from '../../contexts/ConfigContext';
import { money } from '../../utils/format';
import {
  activeWeapon,
  grenades,
  hasKnife,
  isReloading,
  isScoped,
  primaryWeapon,
  secondaryWeapon
} from '../../utils/weapons';
import { initials, playerRole, type PlayerRole } from '../../utils/players';
import { Flag } from '../shared/Flag';
import { WeaponIcon } from '../shared/WeaponIcon';
import {
  AWPerIcon,
  AnchorIcon,
  ArmorIcon,
  DefuseKitIcon,
  EntryIcon,
  FireIcon,
  HelmetIcon,
  IGLIcon,
  LurkerIcon,
  SkullIcon,
  StarIcon,
  SupportIcon
} from '../shared/Icons';
import { slideLeft, slideRight, t } from '../../animations';

const ROLE_ICONS: Record<PlayerRole, typeof IGLIcon> = {
  igl: IGLIcon,
  awp: AWPerIcon,
  entry: EntryIcon,
  support: SupportIcon,
  anchor: AnchorIcon,
  lurker: LurkerIcon
};

function hpColor(hp: number): string {
  if (hp > 60) return 'var(--hp-high)';
  if (hp > 25) return 'var(--hp-mid)';
  return 'var(--hp-low)';
}

interface Props {
  player: Player;
  align: 'left' | 'right';
}

export const PlayerCard = memo(function PlayerCard({ player, align }: Props) {
  const { game, observed } = useHUD();
  const config = useConfig();
  const stats = usePlayerStats(player.steamid);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const hp = player.state.health;
  const alive = hp > 0;
  const prevHp = usePrevious(hp);

  // Damage flash: briefly tint the card when HP drops.
  const [hit, setHit] = useState(false);
  useEffect(() => {
    if (prevHp !== undefined && hp < prevHp && hp > 0) {
      setHit(true);
      const id = window.setTimeout(() => setHit(false), 380);
      return () => window.clearTimeout(id);
    }
  }, [hp, prevHp]);

  const flashed = player.state.flashed; // 0-255
  const smoked = player.state.smoked ?? 0;
  const burning = player.state.burning;
  const isObserved = observed?.steamid === player.steamid;

  const primary = primaryWeapon(player.weapons);
  const secondary = secondaryWeapon(player.weapons);
  const active = activeWeapon(player.weapons);
  const nades = grenades(player.weapons);
  const knife = hasKnife(player.weapons);
  const reloading = alive && isReloading(player.weapons);
  const scoped = alive && isScoped(player.weapons);

  const bomb = game?.bomb;
  const defusing = bomb?.state === 'defusing' && bomb.player?.steamid === player.steamid;
  const planting = bomb?.state === 'planting' && bomb.player?.steamid === player.steamid;

  const role = config.modules.show_player_roles ? playerRole(player) : null;
  const RoleIcon = role ? ROLE_ICONS[role] : null;

  const variants = align === 'left' ? slideLeft : slideRight;

  return (
    <motion.div
      className={styles.card}
      data-align={align}
      data-side={player.team.side}
      data-alive={alive}
      data-observed={isObserved}
      data-hit={hit}
      variants={variants}
      layout
    >
      {/* live state washes (GPU-composited overlays, never re-layout) */}
      <AnimatePresence>
        {alive && flashed > 20 && (
          <motion.div
            key="flash"
            className={styles.flashWash}
            initial={{ opacity: 0 }}
            animate={{ opacity: Math.min(0.85, flashed / 255) }}
            exit={{ opacity: 0 }}
            transition={t(0.16)}
          />
        )}
        {alive && burning > 0 && (
          <motion.div
            key="burn"
            className={styles.burnWash}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={t(0.2)}
          />
        )}
        {alive && smoked > 40 && (
          <motion.div
            key="smoke"
            className={styles.smokeWash}
            initial={{ opacity: 0 }}
            animate={{ opacity: Math.min(0.6, smoked / 255) }}
            exit={{ opacity: 0 }}
            transition={t(0.2)}
          />
        )}
      </AnimatePresence>

      <div className={styles.cardMain}>
        <div className={styles.avatarBox}>
          {player.avatar && !avatarFailed ? (
            <img className={styles.avatar} src={player.avatar} alt="" onError={() => setAvatarFailed(true)} />
          ) : (
            <span className={styles.avatarFallback}>{initials(player.name)}</span>
          )}
          {!alive && (
            <motion.span
              className={styles.deadMark}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={t(0.3)}
            >
              <SkullIcon size={16} />
            </motion.span>
          )}
        </div>

        <div className={styles.identity}>
          <div className={styles.nameRow}>
            <Flag country={player.country} height={10} />
            <span className={styles.playerName}>{player.name}</span>
            {RoleIcon && (
              <span className={styles.roleIcon} title={role ?? undefined}>
                <RoleIcon size={11} />
              </span>
            )}
            {player.stats.mvps > 0 && (
              <span className={styles.mvps} title={`${player.stats.mvps} MVPs`}>
                <StarIcon size={9} />
                <span className="mono">{player.stats.mvps}</span>
              </span>
            )}
          </div>

          <div className={styles.statusRow}>
            {alive ? (
              <>
                <span className={styles.moneyText} data-negative={player.state.money < 1000}>
                  {money(player.state.money)}
                </span>
                <span className={styles.utilRow}>
                  {nades.map(n => (
                    <WeaponIcon key={n.id} name={n.name} height={10} />
                  ))}
                </span>
                {player.state.round_kills > 0 && (
                  <motion.span
                    key={player.state.round_kills}
                    className={styles.roundKills}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    transition={t(0.24)}
                  >
                    +{player.state.round_kills}
                  </motion.span>
                )}
              </>
            ) : (
              <span className={styles.deadStats}>
                {stats.kills}-{stats.deaths} · ADR {Math.round(stats.adr)} · {Math.round(stats.kast)}% KAST
              </span>
            )}
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.kdaRow}>
            <span className="mono">{player.stats.kills}</span>
            <span className={styles.kdaDivider}>/</span>
            <span className="mono">{player.stats.deaths}</span>
            {stats.currentStreak >= 3 && (
              <motion.span
                className={styles.streak}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={t(0.24)}
              >
                <FireIcon size={10} /> {stats.currentStreak}
              </motion.span>
            )}
          </div>

          {alive && (
            <div className={styles.gearRow}>
              {player.state.helmet ? (
                <HelmetIcon size={12} className={styles.gearIcon} />
              ) : player.state.armor > 0 ? (
                <ArmorIcon size={12} className={styles.gearIcon} />
              ) : null}
              {player.state.defusekit && <DefuseKitIcon size={12} className={styles.kitIcon} />}
              {secondary && active?.id !== secondary.id && (
                <WeaponIcon name={secondary.name} height={11} active={false} />
              )}
              {primary && active?.id !== primary.id && <WeaponIcon name={primary.name} height={11} active={false} />}
              {active && (
                <span className={styles.activeWeapon}>
                  <WeaponIcon name={active.name} height={13} />
                  {typeof active.ammo_clip === 'number' && (
                    <span className={`${styles.ammo} mono`} data-reloading={reloading}>
                      {reloading ? 'RELOAD' : `${active.ammo_clip}/${active.ammo_reserve ?? 0}`}
                    </span>
                  )}
                </span>
              )}
              {!active && knife && <WeaponIcon name="knife" height={11} />}
              {scoped && <span className={styles.scopedTag}>SCOPED</span>}
            </div>
          )}
        </div>
      </div>

      {/* HP bar with trailing damage ghost */}
      <div className={styles.hpTrack} data-alive={alive}>
        <motion.div
          className={styles.hpGhost}
          initial={false}
          animate={{ width: `${Math.max(0, prevHp ?? hp)}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        />
        <motion.div
          className={styles.hpFill}
          style={{ background: hpColor(hp) }}
          initial={false}
          animate={{ width: `${Math.max(0, hp)}%` }}
          transition={t(0.24)}
        />
        {alive && <span className={`${styles.hpNumber} mono`}>{hp}</span>}
        {alive && flashed > 20 && (
          <span className={`${styles.blindPct} mono`}>{Math.round((flashed / 255) * 100)}% BLIND</span>
        )}
      </div>

      {/* bomb interaction progress */}
      <AnimatePresence>
        {(defusing || planting) && (
          <motion.div
            key="action"
            className={styles.actionBar}
            data-kind={defusing ? 'defuse' : 'plant'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 16 }}
            exit={{ opacity: 0, height: 0 }}
            transition={t(0.2)}
          >
            <span>{defusing ? (player.state.defusekit ? 'DEFUSING · KIT' : 'DEFUSING') : 'PLANTING'}</span>
            <motion.div
              className={styles.actionFill}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: defusing ? (player.state.defusekit ? 5 : 10) : 3.2, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
