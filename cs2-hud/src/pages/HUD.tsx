import { AnimatePresence } from 'framer-motion';
import { HUDLayout } from '../layouts/HUDLayout';
import { useConfig } from '../contexts/ConfigContext';
import { useHUD } from '../contexts/HUDContext';
import { useActionToggle } from '../hooks/useAction';
import { TopBar } from '../components/TopBar/TopBar';
import { RoundIndicators } from '../components/Center/RoundIndicators';
import { TeamColumn } from '../components/Players/TeamColumn';
import { ObservedPlayer } from '../components/Players/ObservedPlayer';
import { Killfeed } from '../components/Killfeed/Killfeed';
import { Radar } from '../components/Radar/Radar';
import { BottomPanel } from '../components/Bottom/BottomPanel';
import { ObserverPanel } from '../components/Observer/ObserverPanel';
import { PauseOverlay } from '../components/Overlays/PauseOverlay';
import { ReplayOverlay } from '../components/Overlays/ReplayOverlay';
import { MVPOverlay } from '../components/Overlays/MVPOverlay';
import { WinnerOverlay } from '../components/Overlays/WinnerOverlay';
import { TeamsIntro } from '../components/Overlays/TeamsIntro';
import { MapVeto } from '../components/Overlays/MapVeto';
import { StatsOverlay } from '../components/Overlays/StatsOverlay';

/**
 * The single broadcast page. Every module is mounted permanently and animates
 * itself in/out — keybinds only flip visibility flags, so nothing re-fetches
 * or loses state mid-round.
 */
export function HUDPage() {
  const config = useConfig();
  const { game, leftTeam, rightTeam, leftPlayers, rightPlayers, observed } = useHUD();

  const [showLineups, setLineups] = useActionToggle('toggleLineups');
  const [showVeto, setVeto] = useActionToggle('toggleVeto');
  const [showStats, setStats] = useActionToggle('toggleStats');
  const [showComparison] = useActionToggle('toggleComparison');
  const [showReplay] = useActionToggle('toggleReplay');
  const [showObserver] = useActionToggle('toggleObserver', config.modules.show_observer);
  const [showRadar] = useActionToggle('toggleRadar', config.modules.show_radar);
  const [showBottom] = useActionToggle('toggleBottom', config.modules.show_bottom);
  const [showKillfeed] = useActionToggle('toggleKillfeed', config.modules.show_killfeed);

  const anyFullscreen = showLineups || showVeto || showStats || showComparison;

  return (
    <HUDLayout>
      {game && (
        <>
          <div className="zone-top">
            <TopBar />
          </div>

          <div className="zone-center-indicators">
            <RoundIndicators />
          </div>

          <AnimatePresence>
            {showRadar && !anyFullscreen && (
              <div className="zone-radar">
                <Radar size={config.display.radar_size} />
              </div>
            )}
          </AnimatePresence>

          {showKillfeed && (
            <div className="zone-killfeed">
              <Killfeed limit={config.display.killfeed_limit} />
            </div>
          )}

          <div className="zone-left-team">
            <TeamColumn team={leftTeam} players={leftPlayers} side="left" />
          </div>
          <div className="zone-right-team">
            <TeamColumn team={rightTeam} players={rightPlayers} side="right" />
          </div>

          <AnimatePresence>
            {observed && observed.state.health > 0 && !anyFullscreen && (
              <div className="zone-observed">
                <ObservedPlayer player={observed} />
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showBottom && (
              <div className="zone-bottom">
                <BottomPanel />
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showObserver && (
              <div className="zone-observer-panel">
                <ObserverPanel />
              </div>
            )}
          </AnimatePresence>

          <PauseOverlay />
          <MVPOverlay />
          <WinnerOverlay />
        </>
      )}

      <ReplayOverlay visible={showReplay} />

      <AnimatePresence>
        {showLineups && <TeamsIntro onClose={() => setLineups(false)} />}
        {showVeto && <MapVeto onClose={() => setVeto(false)} />}
        {(showStats || showComparison) && <StatsOverlay comparison={showComparison} onClose={() => setStats(false)} />}
      </AnimatePresence>
    </HUDLayout>
  );
}
