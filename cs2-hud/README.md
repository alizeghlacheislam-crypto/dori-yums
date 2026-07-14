# Aurora — CS2 Broadcast HUD for Lexogrine HUD Manager

A production-grade, broadcast-ready Counter-Strike 2 HUD built for
[Lexogrine HUD Manager (LHM)](https://lhm.gg). Original premium design —
dark glassmorphism, tight typography, sub-400 ms motion — engineered
around LHM's socket + REST APIs.

Built with **React 18 · TypeScript (strict) · CSS Modules · Framer Motion · SVG · socket.io**.

---

## Feature map

| Area | What's included |
|---|---|
| **Top bar** | Team names/logos/sides, animated scores, series dots (BO1–BO5), map name, round number & timer, bomb/defuse countdown, alive-player dots, timeout pips, loss-bonus ladder, team bank & equipment value, coach line, tournament/sponsor branding, match title, match/map-point & overtime tags, live win-probability bar |
| **Player cards** | Avatar (LHM/Steam), flag, name, role icon (IGL/AWPer/Entry/Support/Anchor/Lurker), HP bar with damage ghost, armor/helmet/defuse-kit, bomb carrier, active weapon with clip/reserve ammo, holstered primary/secondary, grenade belt, money with pulse, K/A/D, ADR, HS%, kill-streak badge, MVP stars, flash/smoke/burn/damage overlays, planting & defusing progress strips, dead state with KAST |
| **Observed player** | Lower-third with real name, role, vitals, weapon + ammo, rating (live HLTV-style), ADR, KAST, HS%, utility damage, flash assists, trade kills |
| **Center** | Bomb planted/defused/exploded banners with planter & site, clutch chip (1vX), ace banner, ninja-defuse detection, round-winner banner, bomb/defuse progress line |
| **Killfeed** | Frame-diff kill detection with headshot, through-smoke (geometric smoke check), attacker-blind, airborne, no-scope, collateral (×2/×3), multi-kill (2K–ACE), trade, revenge, teamkill, suicide, flash-assist — plus HLAE/mirv enrichment (`update_mirv`) for true wallbang/no-scope flags when available |
| **Radar** | Custom SVG radar for the full map pool (calibrated Valve overview transforms), view cones, dead markers, bomb with pulse, smokes/mollies/HE/flash/decoy, bombsite labels, split-level fading (Nuke/Vertigo), optional overview image per map (`public/maps/de_*.png`) |
| **Economy** | Freezetime economy module + Alt+B toggle: bank/equip/loss bonus per team, buy classification (eco/semi/force/full/pistol), next-round buy prediction, SVG equipment-value graph across the map |
| **Round history** | Per-round win markers with cause icons (elim/defuse/bomb/time), halves split, side-swap aware |
| **Overlays** | Teams intro with lineups/coaches/roles/form prediction (Alt+I), map veto board from LHM match data (Alt+V), head-to-head star comparison (Alt+H), full stats board with advanced table + positional heatmap + weapon kills (Alt+S), pause/timeout banners (automatic), replay frame with timer (Alt+R), observer panel with cam slots & X-ray (Alt+O), winner screen with confetti and map MVP (automatic at map end) |
| **Stats engine** | ADR, KAST, live rating, HS%, utility damage, flash assists, trade %, entry duels, opening duels, clutch attempts/wins, multi-kill rounds, per-weapon kills — all accumulated client-side from GSI deltas, mid-match attach safe |

## Project structure

```
cs2-hud/
├── hud.json               LHM manifest: keybinds + settings panel
├── index.html             Vite entry (Google Fonts: Inter/Rajdhani/Orbitron)
├── public/maps/           Optional radar overview images (de_mirage.png, …)
└── src/
    ├── animations/        Shared easing curves + framer-motion variants
    ├── assets/
    │   ├── icons/         Status/role glyph set (SVG, currentColor)
    │   └── weapons/       Parameterized weapon silhouette system
    ├── components/
    │   ├── TopBar/  Players/  Observed/  Center/  Killfeed/
    │   ├── Radar/  Bottom/  Overlays/  Observer/  shared/
    ├── contexts/          GSIContext (game state), ConfigContext (theme/overlays)
    ├── hooks/             useKillfeed, usePulse, useSmoothedValue, useHUDScale,
    │                      useEconomyHistory, usePositionHeatmap, …
    ├── layouts/           HUDLayout — z-order composition
    ├── pages/             HUDPage — scaled 1920×1080 canvas
    ├── services/          socket, engine (event core), gsiParser,
    │                      killDetector, statsTracker, lhmApi
    ├── styles/            Design tokens + global canvas scaling
    ├── types/             Raw GSI, domain model, config schemas
    └── utils/             weapons, economy, stats, maps, vectors, formatting
```

## Installation

```bash
# 1. Build
npm install
npm run build

# 2. Package for LHM: zip the HUD so hud.json sits at the archive root
#    together with the dist output as the HUD entry.
#    LHM loads index.html from the package root, so copy dist up:
cp -r dist/* .   # or point your packaging script at dist/
zip -r aurora-hud.zip index.html assets hud.json maps

# 3. In Lexogrine HUD Manager: HUDs → Upload HUD → select aurora-hud.zip
# 4. Load a match, start CS2 with GSI configured by LHM, select Aurora → Run HUD
```

For development against a running LHM instance:

```bash
npm run dev
# open http://localhost:5173/?port=1349   (LHM's socket port)
```

## Configuration

Three layers, later wins:

1. **Defaults** — `src/types/config.ts`
2. **`config.json`** — optional static file next to `index.html` (same shape as `HUDConfig`)
3. **LHM settings panel** — everything in `hud.json → panel`: tournament/sponsor logos,
   match title, accent colors, panel opacity, corner style, and per-module toggles
   (radar, killfeed, round history, economy graph, win probability, role icons,
   observer panel, reduced motion)

Player **roles** come from the LHM player database: add `role` = `igl` /
`awper` / `support` / `anchor` / `lurker` / `entry` in a player's *extra*
fields. Team **coaches** come from a team's extra field `coach`.

### Keybinds (registered in `hud.json`)

| Bind | Action |
|---|---|
| Alt+S | Match statistics board |
| Alt+V | Map veto |
| Alt+I | Teams intro / lineups |
| Alt+H | Head-to-head comparison |
| Alt+B | Economy panel |
| Alt+R | Replay frame |
| Alt+O | Observer panel |
| Alt+C | Cam/slot board |

## Design system

- **Palette** — background `#0B0D11`, cards `#151A22`, glass `rgba(255,255,255,.06)`,
  primary `#E63946`, secondary `#2EC4B6`, accent `#FFD166`, dim text `#A0A7B4`,
  CT `#4DA3FF`, T `#F2A33C`
- **Type** — Inter (body), Rajdhani (display), Orbitron (timers only)
- **Motion** — every transition ≤ 400 ms on shared cubic-bezier curves
  (`--ease-out`, `--ease-snap`); GPU-friendly transforms/opacity only;
  reduced-motion toggle collapses all animation
- **Resolution** — authored on a fixed 1920×1080 canvas and uniformly scaled:
  pixel-identical at 1080p/1440p/4K; 21:9 ultrawide letterboxes the HUD around
  the game feed

## Performance

- All game logic lives in a framework-free engine (`services/engine.ts`);
  React only subscribes to immutable state snapshots
- Every component is `memo`-ized; number tweens and win-probability smoothing
  run on rAF outside React renders
- Killfeed/alerts are event-driven (no polling); radar movement uses CSS
  transform transitions

## Notes on data fidelity

- Kills, headshots, assists, deaths, bomb states, money, equipment: exact (GSI).
- Through-smoke uses real smoke positions vs. the attacker–victim line;
  attacker-blind uses the attacker's flash amount; airborne uses z-history.
- Wallbang and true no-scope aren't observable in GSI: the killfeed upgrades
  those flags automatically from LHM's HLAE/mirv feed (`update_mirv`) when a
  mirv-connected observer client is running; without it, a distance heuristic
  marks close-range sniper kills as no-scopes and wallbang stays off.
- Utility damage is attributed from damage deltas coincident with the dealer's
  detonating HE / burning molly — a tight heuristic, labeled as such in code.
