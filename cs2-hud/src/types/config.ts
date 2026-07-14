/**
 * HUD configuration schema.
 *
 * Values come from three layered sources (later wins):
 *   1. `defaultConfig` below,
 *   2. `public/config.json` shipped with the HUD (optional, static),
 *   3. LHM panel settings pushed over the `hud_config` socket event.
 */

export interface HUDConfig {
  branding: {
    tournamentLogo: string;
    sponsorLogo: string;
    matchTitle: string;
    tournamentName: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    highlightColor: string;
    panelOpacity: 'low' | 'default' | 'high';
    cornerStyle: 'rounded' | 'sharp';
    fontBody: string;
    fontDisplay: string;
    fontTimer: string;
  };
  modules: {
    showRadar: boolean;
    showKillfeed: boolean;
    showRoundHistory: boolean;
    showEconomyGraph: boolean;
    showWinProbability: boolean;
    showPlayerRoles: boolean;
    showObserverPanel: boolean;
    reducedMotion: boolean;
  };
  layout: {
    playerCardWidth: number;
    radarSize: number;
    killfeedMaxEntries: number;
    roundHistoryRounds: number;
  };
}

export const defaultConfig: HUDConfig = {
  branding: {
    tournamentLogo: '',
    sponsorLogo: '',
    matchTitle: '',
    tournamentName: 'AURORA CHAMPIONSHIP',
  },
  theme: {
    primaryColor: '#E63946',
    secondaryColor: '#2EC4B6',
    highlightColor: '#FFD166',
    panelOpacity: 'default',
    cornerStyle: 'rounded',
    fontBody: "'Inter', sans-serif",
    fontDisplay: "'Rajdhani', sans-serif",
    fontTimer: "'Orbitron', sans-serif",
  },
  modules: {
    showRadar: true,
    showKillfeed: true,
    showRoundHistory: true,
    showEconomyGraph: true,
    showWinProbability: true,
    showPlayerRoles: true,
    showObserverPanel: false,
    reducedMotion: false,
  },
  layout: {
    playerCardWidth: 340,
    radarSize: 320,
    killfeedMaxEntries: 5,
    roundHistoryRounds: 30,
  },
};

/** Overlay visibility toggled by LHM keybind actions. */
export interface OverlayState {
  stats: boolean;
  veto: boolean;
  teamsIntro: boolean;
  headToHead: boolean;
  bottomPanel: boolean;
  replay: boolean;
  observerPanel: boolean;
  cams: boolean;
}

export const initialOverlayState: OverlayState = {
  stats: false,
  veto: false,
  teamsIntro: false,
  headToHead: false,
  bottomPanel: false,
  replay: false,
  observerPanel: false,
  cams: false,
};
