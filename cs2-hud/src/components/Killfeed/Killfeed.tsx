import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Killfeed.module.css';
import { useKillfeed } from '../../hooks/useKillfeed';
import type { KillfeedEntry } from '../../types/stats';
import { WeaponIcon } from '../shared/WeaponIcon';
import {
  AirborneIcon,
  BlindIcon,
  BombIcon,
  FlashAssistIcon,
  HeadshotIcon,
  NoScopeIcon,
  SkullIcon,
  SmokeKillIcon,
  WallbangIcon
} from '../shared/Icons';
import { killfeedRow } from '../../animations';

const MULTI_LABEL: Record<number, string> = { 2: 'DOUBLE', 3: 'TRIPLE', 4: 'QUAD', 5: 'ACE' };

const Row = memo(function Row({ entry }: { entry: KillfeedEntry }) {
  const highlight = entry.multiKill >= 3 || entry.weapon === 'knife' || entry.revenge;
  return (
    <motion.div
      className={styles.row}
      data-highlight={highlight}
      variants={killfeedRow}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <div className={styles.rowInner}>
        {entry.suicide ? (
          <span className={styles.name} data-side={entry.victimSide}>
            {entry.victimName}
          </span>
        ) : (
          <>
            {entry.killerName && (
              <span className={styles.name} data-side={entry.killerSide ?? undefined}>
                {entry.killerName}
              </span>
            )}
            {entry.assisterName && (
              <>
                <span className={styles.plus}>+</span>
                <span className={styles.name} data-side={entry.assisterSide ?? undefined}>
                  {entry.assisterName}
                </span>
                {entry.flashAssist && <FlashAssistIcon size={11} className={styles.badge} />}
              </>
            )}
          </>
        )}

        <span className={styles.weapon}>
          {entry.weapon === 'planted_c4' || entry.weapon === 'c4' ? (
            <BombIcon size={14} />
          ) : entry.suicide ? (
            <SkullIcon size={13} />
          ) : (
            <WeaponIcon name={entry.weapon} height={14} />
          )}
          {entry.attackerblind && <BlindIcon size={11} className={styles.badge} />}
          {entry.noscope && <NoScopeIcon size={11} className={styles.badge} />}
          {entry.thrusmoke && <SmokeKillIcon size={11} className={styles.badge} />}
          {entry.attackerinair && <AirborneIcon size={11} className={styles.badge} />}
          {entry.wallbang && <WallbangIcon size={11} className={styles.badge} />}
          {entry.headshot && <HeadshotIcon size={11} className={styles.badgeHS} />}
        </span>

        <span className={styles.name} data-side={entry.victimSide} data-teamkill={entry.teamkill}>
          {entry.victimName}
        </span>

        {(entry.trade || entry.revenge || entry.teamkill || entry.multiKill >= 2) && (
          <span className={styles.tags}>
            {entry.trade && <em className={styles.tag}>TRADE</em>}
            {entry.revenge && <em className={styles.tag}>REVENGE</em>}
            {entry.teamkill && (
              <em className={styles.tag} data-danger="true">
                TEAMKILL
              </em>
            )}
            {entry.multiKill >= 2 && (
              <em className={styles.tag} data-multi="true">
                {MULTI_LABEL[Math.min(entry.multiKill, 5)]}
              </em>
            )}
          </span>
        )}
      </div>
    </motion.div>
  );
});

export function Killfeed({ limit }: { limit: number }) {
  const entries = useKillfeed(limit);
  return (
    <AnimatePresence initial={false}>
      {entries.map(entry => (
        <Row key={entry.id} entry={entry} />
      ))}
    </AnimatePresence>
  );
}
