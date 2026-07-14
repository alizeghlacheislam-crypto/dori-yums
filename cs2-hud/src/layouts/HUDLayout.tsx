import { memo } from 'react';
import { TopBar } from '@/components/TopBar/TopBar';
import { PlayerList } from '@/components/Players/PlayerList';
import { ObservedPlayer } from '@/components/Observed/ObservedPlayer';
import { CenterAlerts } from '@/components/Center/CenterAlerts';
import { Killfeed } from '@/components/Killfeed/Killfeed';
import { Radar } from '@/components/Radar/Radar';
import { RoundHistory } from '@/components/Bottom/RoundHistory';
import { EconomyPanel } from '@/components/Bottom/EconomyPanel';
import { StateBanners } from '@/components/Overlays/StateBanners';
import { ObserverPanel } from '@/components/Observer/ObserverPanel';
import { TeamsIntro } from '@/components/Overlays/TeamsIntro';
import { MapVeto } from '@/components/Overlays/MapVeto';
import { HeadToHead } from '@/components/Overlays/HeadToHead';
import { StatsOverlay } from '@/components/Overlays/StatsOverlay';
import { WinnerOverlay } from '@/components/Overlays/WinnerOverlay';

/**
 * Z-order composition of the whole broadcast frame. In-round modules
 * first, then state banners, then full-screen production overlays.
 */
export const HUDLayout = memo(() => (
  <div className="hud-canvas">
    <Radar />
    <TopBar />
    <RoundHistory />
    <PlayerList orientation="left" />
    <PlayerList orientation="right" />
    <ObservedPlayer />
    <Killfeed />
    <CenterAlerts />
    <EconomyPanel />
    <StateBanners />
    <ObserverPanel />

    <TeamsIntro />
    <MapVeto />
    <HeadToHead />
    <StatsOverlay />
    <WinnerOverlay />
  </div>
));
HUDLayout.displayName = 'HUDLayout';
