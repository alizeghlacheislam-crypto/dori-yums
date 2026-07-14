# AURORA — CS2 Broadcast HUD for Lexogrine HUD Manager

A premium, broadcast-grade Counter-Strike 2 overlay built for
[Lexogrine HUD Manager](https://lhm.gg) (LHM). Dark, glassmorphic, minimal —
designed for tournament production (think ESL / BLAST / PGL tier), not for
gaming-RGB stream kits.

![Stack](https://img.shields.io/badge/react-18-blue) ![TS](https://img.shields.io/badge/typescript-5-blue) ![Motion](https://img.shields.io/badge/framer--motion-11-purple)

---

## Features

**Top bar** — tournament + sponsor branding, match title, map + best-of tag,
team logos/names, CT/T side colors, map score, series score dots, timeout
pips, coach line, alive-player segments, team money / equipment value / loss
bonus, round + bomb timers (rAF-interpolated for 60fps sweeps), win-probability
bar, warmup/pause/timeout aware clock.

**Player cards (5v5 side stacks)** — Steam avatar (with monogram fallback),
name, country flag, HP bar with trailing damage ghost, armor/helmet/defuse
kit, active + holstered weapons with live ammo, reloading + scoped states,
grenade loadout, money, round kills, K/D, kill streaks, MVP stars, role icons
(IGL / AWP / entry / support / anchor / lurker via LHM player `extra.role`),
alive/dead transitions, damage flash, flashed/burning/smoked washes with
blind %, planting/defusing progress bars, observed-player highlight.

**Observed player spotlight** — expanded identity + full statistical read:
K/A/D, ADR, KAST, HS%, utility damage, flash assists, HLTV-style rating,
loadout and ammo.

**Killfeed** — animated rows with weapon silhouettes and badges for headshot,
wallbang, noscope, smoke kill, attacker-blind, airborne, flash assist; TRADE /
REVENGE / TEAMKILL / multi-kill (DOUBLE→ACE) tags; suicides; auto-expiry and
round reset.

**Custom radar** — fully vector (no game assets): player dots with view cones
and slot numbers, dead X markers, flash pulses, bomb (dropped / planted /
defusing with pulse), smokes that bloom + fade with effect time, molotov
flames, HE/flash/decoy marks, bombsite plant zones, and upper/lower level
awareness on Nuke/Vertigo following the observed player.

**Center moments** — bomb plant/defuse banners with the defuse-vs-detonation
race bar ("NOT ENOUGH TIME"), ninja-defuse detection, clutch 1vX indicator,
ACE banner, overtime + map/match point callouts.

**Bottom panel** — full round history strip (win icons per round, halftime
side-swap aware), per-round equipment value graph, team money / equipment /
loss bonus and next-round buy prediction (FULL BUY → FULL ECO), shown
automatically during freezetime.

**Overlays** — team intro/lineups with coach, map veto board (bans / picks /
decider, start sides, per-map winners + scores from the LHM match record),
match stats takeover (per-player table: ADR, KAST, HS%, utility damage, flash
assists, entry duels, trade %, clutches, rating — best-in-column highlighted),
kills-by-weapon chart, kill-position heatmap, round MVP lower third, map/series
winner screen with confetti, tactical timeout / technical pause takeover, and
a replay wipe with watermark + timer.

**Observer panel** — camera mode (freecam / player cam), current spec target,
X-ray status.

**Statistics engine** — a live tracker fed by GSI + game events computes KAST,
trades and traded deaths, opening duels, clutch attempts/conversions, flash
assists, utility damage, multi-kill counts, streaks, weapon kill totals and
kill positions. ADR uses csgogsi's authoritative per-round damage tracking.

---

## Requirements

- Node.js ≥ 18
- Lexogrine HUD Manager (CS2)

## Installation

```bash
cd cs2-hud
npm install
npm run build
```

Then load it into LHM:

1. Zip the **contents** of the `build/` directory (`index.html`, `hud.json`,
   `config.json`, `assets/`) — not the folder itself.
2. In LHM: **HUDs → Upload HUD** and drop the zip, or copy the `build/`
   contents into a folder inside LHM's `HUDs` directory.
3. Assign teams/players to your match, set the HUD in the match settings and
   run the overlay (OBS browser source at 1920×1080, transparent background).

### Development

```bash
npm run dev            # dev server on http://localhost:3500
```

- With LHM running locally, the HUD connects to its socket on port `1349`
  and receives live GSI data.
- **No game? No LHM?** Open `http://localhost:3500/?demo=1` — a built-in
  synthetic GSI feed renders a full mid-round state (players, kills, radar,
  economy) so you can iterate on design instantly. In demo mode the console
  helper `hudAction('toggleStats')` fires any keybind action.

```bash
npm run typecheck      # strict TS pass
npm run preview        # serve the production build
```

## Configuration

Three layers, later wins:

1. **Defaults** in `src/types/config.ts`
2. **`public/config.json`** — edit and rebuild (or edit `config.json` inside
   the build) to change colors, fonts opacity, module visibility, radar size,
   killfeed length, series override, branding
3. **LHM HUD settings panel** — everything in `hud.json → panel` is editable
   live from the LHM UI: tournament/sponsor logos, match title, theme colors,
   panel opacity, reduced motion, and per-module toggles

### Keybinds (configured in `hud.json`)

| Bind  | Action                        |
| ----- | ----------------------------- |
| Alt+L | Team intro / lineups          |
| Alt+V | Map veto board                |
| Alt+S | Match statistics              |
| Alt+C | Head-to-head comparison       |
| Alt+R | Replay overlay                |
| Alt+O | Observer panel                |
| Alt+D | Radar                         |
| Alt+B | Bottom economy panel          |
| Alt+K | Killfeed                      |
| Alt+W | Winner screen (re-show/hide)  |

### Player roles & coaches

Role icons read the `role` field from LHM **Players → Extra** (values: `igl`,
`awp`, `entry`, `support`, `anchor`, `lurker`); the AWP icon falls back to the
current AWP carrier. Coach names read the `coach` field from LHM **Teams →
Extra**.

## Project structure

```
cs2-hud/
├── public/            hud.json (LHM manifest + panel + keybinds), config.json
└── src/
    ├── animations/    motion language: easings + shared variants (≤400ms)
    ├── assets/        vector brand assets
    ├── components/
    │   ├── TopBar/    score bug, timers, economy, win probability
    │   ├── Players/   team columns, player cards, observed spotlight
    │   ├── Killfeed/
    │   ├── Radar/
    │   ├── Center/    bomb/clutch/ace/match-point indicators
    │   ├── Bottom/    round history, economy graph, buy prediction
    │   ├── Observer/
    │   ├── Overlays/  intro, veto, stats, MVP, winner, pause, replay
    │   └── shared/    icon set, weapon silhouettes, flags, team logos
    ├── contexts/      HUDContext (game/match state), ConfigContext (theme)
    ├── hooks/         rAF clocks, killfeed, stats store bindings
    ├── layouts/       fixed 1920×1080 canvas, uniform scaling
    ├── pages/         the single broadcast page composition
    ├── services/      socket + GSI wiring, REST client, action bus,
    │                  stats tracker, demo feed
    ├── styles/        CSS custom properties + global reset
    ├── types/         config, match/veto, stats models
    └── utils/         weapons, economy/win-prob models, radar math, format
```

## Performance & rendering

- Fixed 1920×1080 authoring canvas scaled uniformly — pixel-perfect at 1080p,
  1440p and 4K; centred over the game frame on 21:9 ultrawide.
- One shared `csgogsi` digest per game tick; components subscribe through
  contexts and a versioned `useSyncExternalStore` stats store — no duplicate
  parsing, no render loops.
- Clocks and progress bars interpolate GSI ticks with `requestAnimationFrame`.
- Animations are transform/opacity only (GPU-composited), capped at 400ms on
  cubic-bezier easings; heavy list components are memoised.
- Radar movement rides CSS transform transitions between GSI ticks for smooth
  60fps motion.

## Data honesty

Everything shown is derived from real GSI/LHM data. Two stats commonly seen on
desktop analytics (per-shot accuracy, ping) are not exposed by CS2's GSI feed;
the HUD deliberately shows nothing rather than fabricated numbers. Kill events
(and therefore killfeed + KAST/trade stats) require LHM's game event
integration, which is standard in LHM CS2 setups.
