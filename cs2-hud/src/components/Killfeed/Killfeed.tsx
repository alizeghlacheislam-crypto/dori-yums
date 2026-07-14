import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Killfeed.module.css';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { WeaponIcon } from '@/assets/weapons/WeaponIcon';
import {
  AirborneIcon,
  BlindIcon,
  BombIcon,
  FlashedIcon,
  HeadshotIcon,
  ScopeIcon,
  SkullIcon,
  SmokedIcon,
  WallbangIcon,
} from '@/assets/icons/Icons';
import { useKillfeed } from '@/hooks/useKillfeed';
import { useConfig } from '@/contexts/ConfigContext';
import { useGSI } from '@/contexts/GSIContext';
import { feedRow } from '@/animations/variants';
import { cn } from '@/utils/cn';
import type { KillEvent } from '@/types/hud';

const MULTI_LABELS: Record<number, string> = {
  2: '2K',
  3: '3K',
  4: '4K',
  5: 'ACE',
};

const nameClass = (side: 'CT' | 'T') => (side === 'CT' ? styles.nameCT : styles.nameT);

const Entry = memo(({ kill, observedSteamid }: { kill: KillEvent; observedSteamid?: string }) => {
  const involvesObserved =
    kill.attacker?.steamid === observedSteamid || kill.victim.steamid === observedSteamid;

  return (
    <motion.div variants={feedRow} initial="hidden" animate="visible" exit="exit" layout>
      <GlassPanel card className={cn(styles.entry, involvesObserved && styles.highlight)}>
        {kill.isSuicide ? (
          <>
            <span className={nameClass(kill.victim.side)}>{kill.victim.name}</span>
            <span className={styles.icons}>
              {kill.weaponId === 'c4' ? <BombIcon size={13} /> : <SkullIcon size={13} />}
            </span>
          </>
        ) : (
          <>
            <span className={nameClass(kill.attacker!.side)}>{kill.attacker!.name}</span>
            {kill.assister && (
              <>
                <span className={styles.plus}>+</span>
                <span className={cn(nameClass(kill.assister.side), styles.assist)}>
                  {kill.assister.flashAssist && <FlashedIcon size={10} className={styles.flagIcon} />}
                  {kill.assister.name}
                </span>
              </>
            )}
            <span className={styles.icons}>
              {kill.attackerBlind && <BlindIcon size={12} className={styles.flagIcon} />}
              {kill.attackerAirborne && <AirborneIcon size={12} className={styles.flagIcon} />}
              <WeaponIcon weaponId={kill.weaponId} size={14} />
              {kill.noscope && <ScopeIcon size={12} className={styles.flagIcon} />}
              {kill.throughSmoke && <SmokedIcon size={12} className={styles.flagIcon} />}
              {kill.wallbang && <WallbangIcon size={12} className={styles.flagIcon} />}
              {kill.headshot && <HeadshotIcon size={12} className={styles.flagIcon} />}
            </span>
            <span className={nameClass(kill.victim.side)}>{kill.victim.name}</span>
            {kill.collateralCount >= 2 && (
              <span className={styles.multiBadge}>×{kill.collateralCount}</span>
            )}
            {kill.multiKillIndex >= 2 && MULTI_LABELS[kill.multiKillIndex] && (
              <span className={styles.multiBadge}>{MULTI_LABELS[kill.multiKillIndex]}</span>
            )}
            {kill.isTrade && <span className={styles.tradeTag}>TRADE</span>}
            {kill.isRevenge && <span className={styles.tradeTag}>REVENGE</span>}
            {kill.isTeamkill && <span className={styles.multiBadge}>TEAMKILL</span>}
          </>
        )}
      </GlassPanel>
    </motion.div>
  );
});
Entry.displayName = 'Entry';

/** Animated killfeed, newest at the bottom, observer kills highlighted. */
export const Killfeed = memo(() => {
  const config = useConfig();
  const { observerSteamid } = useGSI();
  const kills = useKillfeed(config.layout.killfeedMaxEntries);

  if (!config.modules.showKillfeed) return null;

  return (
    <div className={styles.root}>
      <AnimatePresence mode="popLayout">
        {kills.map((kill) => (
          <Entry key={kill.id} kill={kill} observedSteamid={observerSteamid} />
        ))}
      </AnimatePresence>
    </div>
  );
});
Killfeed.displayName = 'Killfeed';
