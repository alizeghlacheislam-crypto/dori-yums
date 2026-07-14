import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './RoundIndicators.module.css';
import { useHUD } from '../../contexts/HUDContext';
import { useClutch } from '../../hooks/useMatchStats';
import { useBombTimer } from '../../hooks/useBombTimer';
import { GSI } from '../../services/socket';
import { popIn, slideDown } from '../../animations';
import { BombIcon, DefuseKitIcon } from '../shared/Icons';
import type { Player } from 'csgogsi';

interface Banner {
  id: string;
  kind: 'ace' | 'plant' | 'defused' | 'exploded';
  text: string;
}

/**
 * The moment machine under the top bar: bomb lifecycle, defuse race, clutches,
 * aces, overtime and match/map point callouts.
 */
export function RoundIndicators() {
  const { game } = useHUD();
  const clutch = useClutch();
  const bomb = useBombTimer();
  const [banner, setBanner] = useState<Banner | null>(null);

  // Transient event banners driven directly by GSI events.
  useEffect(() => {
    let timer = 0;
    const flash = (b: Banner, ms = 3200) => {
      setBanner(b);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBanner(null), ms);
    };

    const onKill = () => {
      const player = GSI.current?.players.find(p => p.state.round_kills === 5);
      if (player) flash({ id: `ace-${Date.now()}`, kind: 'ace', text: `${player.name} ACE` });
    };
    const onPlant = (player: Player) => flash({ id: `plant-${Date.now()}`, kind: 'plant', text: `${player.name} PLANTED THE BOMB` }, 2600);
    const onDefuse = (player: Player) => {
      const enemies = GSI.current?.players.filter(p => p.team.side === 'T' && p.state.health > 0).length ?? 0;
      flash({
        id: `defused-${Date.now()}`,
        kind: 'defused',
        text: enemies > 0 ? `${player.name} — NINJA DEFUSE` : `${player.name} DEFUSED THE BOMB`
      });
    };
    const onExplode = () => flash({ id: `boom-${Date.now()}`, kind: 'exploded', text: 'TARGET DESTROYED' }, 2600);

    GSI.on('kill', onKill);
    GSI.on('bombPlant', onPlant);
    GSI.on('bombDefuse', onDefuse);
    GSI.on('bombExplode', onExplode);
    return () => {
      GSI.off('kill', onKill);
      GSI.off('bombPlant', onPlant);
      GSI.off('bombDefuse', onDefuse);
      GSI.off('bombExplode', onExplode);
      window.clearTimeout(timer);
    };
  }, []);

  if (!game) return null;

  const clutcher = clutch ? game.players.find(p => p.steamid === clutch.steamid) : null;
  const clutchAlive = clutcher && clutcher.state.health > 0;

  // Match point / map point / overtime derivation (MR12 + MR3 OT).
  const { map } = game;
  const regulationWinsAt = 13;
  const round = map.round;
  const inOT = round >= 24;
  const otWinsAt = inOT ? 13 + 3 * (Math.floor((round - 24) / 6) + 1) : regulationWinsAt;
  const target = Math.max(1, map.num_matches_to_win_series);
  const pointFor = (score: number, mapsWon: number) => {
    if (score !== otWinsAt - 1) return null;
    return mapsWon === target - 1 ? 'MATCH POINT' : 'MAP POINT';
  };
  const ctPoint = pointFor(map.team_ct.score, map.team_ct.matches_won_this_series);
  const tPoint = pointFor(map.team_t.score, map.team_t.matches_won_this_series);

  return (
    <>
      {/* persistent situational strip */}
      <AnimatePresence>
        {(inOT || ctPoint || tPoint) && game.phase_countdowns.phase !== 'warmup' && (
          <motion.div
            key="points"
            className={styles.pointsRow}
            variants={slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {inOT && <span className={styles.otTag}>OVERTIME</span>}
            {ctPoint && (
              <span className={styles.pointTag} data-side="CT">
                {map.team_ct.name} · {ctPoint}
              </span>
            )}
            {tPoint && (
              <span className={styles.pointTag} data-side="T">
                {map.team_t.name} · {tPoint}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* defuse race */}
      <AnimatePresence>
        {bomb.defusing && bomb.defusing.state.health > 0 && (
          <motion.div key="defuse" className={styles.defuseBox} variants={popIn} initial="hidden" animate="visible" exit="exit">
            <div className={styles.defuseHead}>
              {bomb.defusing.state.defusekit && <DefuseKitIcon size={13} />}
              <span>{bomb.defusing.name} IS DEFUSING</span>
              {bomb.defuseTooLate && <em className={styles.tooLate}>NOT ENOUGH TIME</em>}
            </div>
            <div className={styles.defuseTrack}>
              <div className={styles.defuseFill} style={{ width: `${bomb.defuseProgress * 100}%` }} />
              {/* detonation marker on the same track: the race, visualised */}
              <div className={styles.boomMark} style={{ left: `${Math.min(100, (bomb.timeLeft / bomb.defuseTime) * 100)}%` }}>
                <BombIcon size={11} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* clutch */}
      <AnimatePresence>
        {clutchAlive && clutch && (
          <motion.div
            key={`clutch-${clutch.steamid}-${clutch.vs}`}
            className={styles.clutchBox}
            data-side={clutcher!.team.side}
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span className={styles.clutchName}>{clutcher!.name}</span>
            <span className={styles.clutchVs}>1 v {clutch.vs}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* transient banners */}
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.id}
            className={styles.banner}
            data-kind={banner.kind}
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
