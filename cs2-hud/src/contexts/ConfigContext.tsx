import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_CONFIG, mergePanelValues, type HUDConfig, type LHMPanelValues } from '../types/config';
import { onHudConfig } from '../services/socket';
import { resolveAsset } from '../services/api';

const ConfigContext = createContext<HUDConfig>(DEFAULT_CONFIG);

export function useConfig(): HUDConfig {
  return useContext(ConfigContext);
}

/**
 * Layers configuration: bundled defaults ← /config.json ← live LHM panel
 * values, then reflects theme choices into CSS custom properties so plain
 * CSS modules pick them up without re-rendering the tree.
 */
export function ConfigProvider({ children }: { children: ReactNode }) {
  const [fileValues, setFileValues] = useState<LHMPanelValues>({});
  const [panelValues, setPanelValues] = useState<LHMPanelValues>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}config.json`)
      .then(res => (res.ok ? res.json() : {}))
      .then((json: unknown) => {
        if (!cancelled && json && typeof json === 'object') setFileValues(json as LHMPanelValues);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => onHudConfig(values => setPanelValues(values as LHMPanelValues)), []);

  const config = useMemo(() => {
    const withFile = mergePanelValues(DEFAULT_CONFIG, fileValues);
    const merged = mergePanelValues(withFile, panelValues);
    return {
      ...merged,
      branding: {
        ...merged.branding,
        tournament_logo: resolveAsset(merged.branding.tournament_logo),
        sponsor_logo: resolveAsset(merged.branding.sponsor_logo)
      }
    };
  }, [fileValues, panelValues]);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--primary', config.theme.color_primary);
    root.setProperty('--secondary', config.theme.color_secondary);
    root.setProperty('--ct', config.theme.color_secondary);
    root.setProperty('--accent', config.theme.color_accent);
    root.setProperty('--t', config.theme.color_accent);
    root.setProperty('--panel-opacity', String(config.theme.panel_opacity));
  }, [config.theme]);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}
