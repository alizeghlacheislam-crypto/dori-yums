import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSocket } from '@/services/socket';
import { defaultConfig, initialOverlayState, type HUDConfig, type OverlayState } from '@/types/config';

interface ConfigContextValue {
  config: HUDConfig;
  overlays: OverlayState;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: defaultConfig,
  overlays: initialOverlayState,
});

/** Deep-merge one level of sections; later sources win per-field. */
const mergeConfig = (base: HUDConfig, patch: Partial<HUDConfig>): HUDConfig => ({
  branding: { ...base.branding, ...patch.branding },
  theme: { ...base.theme, ...patch.theme },
  modules: { ...base.modules, ...patch.modules },
  layout: { ...base.layout, ...patch.layout },
});

const asBool = (v: unknown, fallback: boolean): boolean =>
  typeof v === 'boolean' ? v : typeof v === 'string' ? v === 'true' : fallback;

/**
 * Map LHM's flat panel payload (section_name keys from hud.json) onto
 * the structured HUDConfig. Unknown keys are ignored so dashboard and
 * HUD versions can evolve independently.
 */
const applyLHMPanelConfig = (base: HUDConfig, data: Record<string, unknown>): HUDConfig => {
  const section = (name: string): Record<string, unknown> =>
    (data[name] as Record<string, unknown>) ?? {};
  const branding = section('branding');
  const theme = section('theme');
  const modules = section('modules');

  return mergeConfig(base, {
    branding: {
      tournamentLogo: String(branding.tournament_logo ?? base.branding.tournamentLogo),
      sponsorLogo: String(branding.sponsor_logo ?? base.branding.sponsorLogo),
      matchTitle: String(branding.match_title ?? base.branding.matchTitle),
      tournamentName: String(branding.tournament_name ?? base.branding.tournamentName),
    },
    theme: {
      ...base.theme,
      primaryColor: String(theme.primary_color ?? base.theme.primaryColor),
      secondaryColor: String(theme.secondary_color ?? base.theme.secondaryColor),
      highlightColor: String(theme.highlight_color ?? base.theme.highlightColor),
      panelOpacity: (theme.panel_opacity as HUDConfig['theme']['panelOpacity']) ?? base.theme.panelOpacity,
      cornerStyle: (theme.corner_style as HUDConfig['theme']['cornerStyle']) ?? base.theme.cornerStyle,
    },
    modules: {
      showRadar: asBool(modules.show_radar, base.modules.showRadar),
      showKillfeed: asBool(modules.show_killfeed, base.modules.showKillfeed),
      showRoundHistory: asBool(modules.show_round_history, base.modules.showRoundHistory),
      showEconomyGraph: asBool(modules.show_economy_graph, base.modules.showEconomyGraph),
      showWinProbability: asBool(modules.show_win_probability, base.modules.showWinProbability),
      showPlayerRoles: asBool(modules.show_player_roles, base.modules.showPlayerRoles),
      showObserverPanel: asBool(modules.show_observer_panel, base.modules.showObserverPanel),
      reducedMotion: asBool(modules.reduced_motion, base.modules.reducedMotion),
    },
  });
};

const ACTION_TO_OVERLAY: Record<string, keyof OverlayState> = {
  toggleStats: 'stats',
  toggleVeto: 'veto',
  toggleTeamsIntro: 'teamsIntro',
  toggleHeadToHead: 'headToHead',
  toggleBottomPanel: 'bottomPanel',
  toggleReplay: 'replay',
  toggleObserverPanel: 'observerPanel',
  toggleCams: 'cams',
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<HUDConfig>(defaultConfig);
  const [overlays, setOverlays] = useState<OverlayState>(initialOverlayState);

  useEffect(() => {
    // Optional static overrides shipped next to the build.
    fetch('./config.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: Partial<HUDConfig> | null) => {
        if (json) setConfig((c) => mergeConfig(c, json));
      })
      .catch(() => undefined);

    const socket = getSocket();
    const onConfig = (data: Record<string, unknown>) =>
      setConfig((c) => applyLHMPanelConfig(c, data ?? {}));
    const onAction = (payload: unknown) => {
      const action =
        typeof payload === 'string'
          ? payload
          : ((payload as { action?: string })?.action ?? '');
      const key = ACTION_TO_OVERLAY[action];
      if (key) setOverlays((o) => ({ ...o, [key]: !o[key] }));
    };

    socket.on('hud_config', onConfig);
    socket.on('hud_action', onAction);
    socket.on('keybindAction', onAction);
    return () => {
      socket.off('hud_config', onConfig);
      socket.off('hud_action', onAction);
      socket.off('keybindAction', onAction);
    };
  }, []);

  // Push theme values into CSS custom properties so plain CSS reacts too.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', config.theme.primaryColor);
    root.style.setProperty('--secondary', config.theme.secondaryColor);
    root.style.setProperty('--accent', config.theme.highlightColor);
    root.style.setProperty('--font-body', config.theme.fontBody);
    root.style.setProperty('--font-display', config.theme.fontDisplay);
    root.style.setProperty('--font-timer', config.theme.fontTimer);
    root.dataset.opacity = config.theme.panelOpacity;
    root.dataset.corners = config.theme.cornerStyle;
    root.dataset.reducedMotion = String(config.modules.reducedMotion);
  }, [config]);

  const value = useMemo(() => ({ config, overlays }), [config, overlays]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): HUDConfig => useContext(ConfigContext).config;
export const useOverlays = (): OverlayState => useContext(ConfigContext).overlays;
