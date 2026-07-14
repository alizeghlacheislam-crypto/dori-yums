/**
 * HUD configuration model.
 *
 * Resolution order (lowest → highest priority):
 *   1. DEFAULT_CONFIG baked into the bundle
 *   2. /config.json shipped next to the build (editable by broadcast crew)
 *   3. Values pushed live from the LHM "HUD settings" panel (hud_config socket event)
 */
export interface HUDConfig {
  branding: {
    tournament_logo: string | null;
    sponsor_logo: string | null;
    match_title: string;
    tournament_name: string;
  };
  theme: {
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    panel_opacity: number;
    reduced_motion: boolean;
  };
  modules: {
    show_radar: boolean;
    show_killfeed: boolean;
    show_bottom: boolean;
    show_round_history: boolean;
    show_win_probability: boolean;
    show_observer: boolean;
    show_player_roles: boolean;
  };
  display: {
    series_type: 'auto' | 'bo1' | 'bo3' | 'bo5';
    radar_size: number;
    killfeed_limit: number;
  };
}

export const DEFAULT_CONFIG: HUDConfig = {
  branding: {
    tournament_logo: null,
    sponsor_logo: null,
    match_title: '',
    tournament_name: 'AURORA CHAMPIONSHIP'
  },
  theme: {
    color_primary: '#E63946',
    color_secondary: '#2EC4B6',
    color_accent: '#FFD166',
    panel_opacity: 1,
    reduced_motion: false
  },
  modules: {
    show_radar: true,
    show_killfeed: true,
    show_bottom: true,
    show_round_history: true,
    show_win_probability: true,
    show_observer: false,
    show_player_roles: true
  },
  display: {
    series_type: 'auto',
    radar_size: 320,
    killfeed_limit: 5
  }
};

/** Raw key/value payload arriving from the LHM settings panel. */
export type LHMPanelValues = Record<string, string | boolean | null | undefined>;

const bool = (v: unknown, fallback: boolean): boolean =>
  typeof v === 'boolean' ? v : typeof v === 'string' ? v === 'true' : fallback;

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.length > 0 ? v : fallback;

/** Merge flat LHM panel values on top of a structured config. */
export function mergePanelValues(base: HUDConfig, values: LHMPanelValues): HUDConfig {
  const seriesRaw = str(values.series_type, base.display.series_type).toLowerCase();
  const series: HUDConfig['display']['series_type'] =
    seriesRaw === 'bo1' || seriesRaw === 'bo3' || seriesRaw === 'bo5' ? seriesRaw : 'auto';

  return {
    branding: {
      tournament_logo: (values.tournament_logo as string) || base.branding.tournament_logo,
      sponsor_logo: (values.sponsor_logo as string) || base.branding.sponsor_logo,
      match_title: str(values.match_title, base.branding.match_title),
      tournament_name: str(values.tournament_name, base.branding.tournament_name)
    },
    theme: {
      color_primary: str(values.color_primary, base.theme.color_primary),
      color_secondary: str(values.color_secondary, base.theme.color_secondary),
      color_accent: str(values.color_accent, base.theme.color_accent),
      panel_opacity: Math.min(1, Math.max(0.2, num(values.panel_opacity, base.theme.panel_opacity))),
      reduced_motion: bool(values.reduced_motion, base.theme.reduced_motion)
    },
    modules: {
      show_radar: bool(values.show_radar, base.modules.show_radar),
      show_killfeed: bool(values.show_killfeed, base.modules.show_killfeed),
      show_bottom: bool(values.show_bottom, base.modules.show_bottom),
      show_round_history: bool(values.show_round_history, base.modules.show_round_history),
      show_win_probability: bool(values.show_win_probability, base.modules.show_win_probability),
      show_observer: bool(values.show_observer, base.modules.show_observer),
      show_player_roles: bool(values.show_player_roles, base.modules.show_player_roles)
    },
    display: {
      series_type: series,
      radar_size: Math.min(520, Math.max(200, num(values.radar_size, base.display.radar_size))),
      killfeed_limit: Math.min(10, Math.max(2, num(values.killfeed_limit, base.display.killfeed_limit)))
    }
  };
}
