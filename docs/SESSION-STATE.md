# Session state

**PROJECT:** Dori Yums — upgrade of the existing static site into a direct-ordering platform + owner admin PWA (Supabase).
**GOAL:** customers order and track online; the owner manages orders, catalog and settings from a phone.
**DEFINITION OF DONE:** M1–M4 in [ROADMAP.md](ROADMAP.md) meet their acceptance criteria; the site still works with no Supabase keys.
**NON-GOALS:** redesign, new stack for the public site, online payment.

**CURRENT MILESTONE:** go-live (ROADMAP.md checklist) — steps 1–3 done, 4–5 open.
**LAST COMPLETED STEP:** real Supabase project connected on production; `/admin` reaches its login screen (verified 2026-10-20).
**NEXT STEP:** the owner signs in at `/admin` on the phone (checklist step 4), then one real end-to-end test order (step 5). M1–M4 live on Vercel since 2026-10-19; `/api/config` fixes 413561b and d4424e7 pushed and deployed. See *Admin access* below.
**DEPLOY NOTES:** pushes go through the GitHub account ragnarfloki414-source (collaborator on alizeghlacheislam-crypto/dori-yums); the network to github.com from this machine is flaky — retry the push a few times.
**BLOCKERS:** none on our side — the next step is the owner's sign-in. Local tests still run without keys (mock: `python tools/mock_supabase.py`).

## Admin access — 2026-10-20

- Environment: production · `https://dori-yums.vercel.app` — established from the canonical tag, `og:url`, README; the live HTML matched local HEAD (`dy-data.js?v=3`, `geo.region`).
- Admin entry: `/admin` — `admin.html` + `vercel.json` `cleanUrls`; manifest `start_url`/`scope` and service-worker scope `/admin`; README.
- Current state: **login screen** (the expected end state) — no setup screen any more.
- FACT (2026-10-20): `/admin` 200 · `/admin/` 200 · `/admin.html` 308 → `/admin`, all with `X-Robots-Tag: noindex, nofollow`; in the browser only `scrLogin` is shown, no console errors; `/api/config` returns its two config fields (values not recorded).
- FACT: how it got here — the setup screen came from `/api/config` returning `{}`; the endpoint learned the Vercel–Supabase integration's variable names and a shape-only status (413561b), then URL normalisation (d4424e7); the status then read "key missing" and the owner added the public key and redeployed.
- REPORTED by the owner: schema run in the Supabase project; the owner's e-mail added to `private.admin_users`.
- NOT TESTED: signing in, the admin role taking effect (an "access denied" screen after sign-in would mean the `admin_users` entry does not match the signed-in account), public sign-ups turned off (checklist step 2), realtime, storage, phone sound/notifications, a real order.
- OWNER ACTION: open `/admin` on the phone → sign in → "Add to Home screen" → turn the bell on once (checklist step 4); in Supabase → Authentication → confirm public sign-ups are off.

## Decisions
- D1 (2026-10-19) Keep the no-build static architecture (index.html + js/ + one Vercel function). Reason: owner rule "modify, don't rebuild"; zero risk to the design.
- D2 Per-flavor unit prices kept (`flavors.price`, as on the v1 site); `pricing.base_unit_price` only applies to flavors with no price.
- D3 Orders are written only through `place_order()` (SECURITY DEFINER), which recomputes every price, tier, fee and discount; the browser never sends prices. Tracking only through `track_order(code, phone)`.
- D4 Owner = Supabase Auth user listed in `private.admin_users`; public sign-ups must be disabled.
- D5 Tier rule: the tier with the highest `min_qty` reached by the WHOLE box applies to every piece (same in SQL and in the page).
- D7 (M3) Box tier = box size: every piece in a box of N gets the tier reached by N (same as `place_order`). Flavors move in steps of `ordering.flavor_step`; a box can only be sent when it is exactly full.
- D8 (M3) Without Supabase the same builder/checkout sends a French WhatsApp message (no promo field, no photo upload, no tracking code).
- D9 (M4) Atelier built without a build step (owner decision 2026-10-19), French by default with AR/EN; customer WhatsApp texts stay French.
- D10 (M4) New-order alerts = realtime + polling fallback while the atelier is open; no push when the app is fully closed (would need Web Push + a server key — FUTURE).
- D11 (M4) Independent adversarial review of the atelier (2026-10-19): 17 findings, none critical. Fixed: settings validated against place_order rules (box step / flavor step / min / max / lead ≤ 365 / numbers ≤ 100000 / base price ≥ 1 / no duplicate tiers or wilayas), badInput typos rejected, offline vs not-configured screens, network error ≠ access denied, alert-enable banner + notification fallback, network-first service worker, X-Frame-Options/frame-ancestors on /admin, ordered reorder writes with reload on failure, per-form unsaved state, Algiers-time month stats, stale-response guard, drawer refresh only on change + signed-URL reuse, settings shape guards, unsupported photo formats. Accepted as known: the 1000-order window, no Web Push.
- D6 Public Supabase keys reach the browser through `/api/config` (env vars `SUPABASE_URL`, `SUPABASE_ANON_KEY`); a secret key is refused.
- D12 (2026-10-23) The announcement bar drifts right → left in all three languages: a CSS `transform` marquee (38 px/s) over `aria-hidden` copies of the one readable `#annText`, built by `layoutBar()`; it pauses on hover and while the close button has focus; with `prefers-reduced-motion` it is the original static, centred line. Text, colours, font and the 38px height are unchanged.

## Assumptions — confirmed by the owner on 2026-10-19 ("القيم المبدئية مقبولة")
- A1 Delivery fees: Alger 500 DZD, other wilayas 1000 DZD, pickup free (`site_settings.delivery`).
- A2 Change/cancellation: free up to 48 h before the date; fully custom event orders up to 5 days (FAQ + modal + JSON-LD).
- A3 Storage: fridge ~4 °C, best within 3 days, max 5 days, out 15–20 min before serving.
- A4 Ordering rules: boxes in steps of 20 (min 20, max 1000), flavors in steps of 5 inside a box, order at least 2 days ahead.
- A5 Mobile numbers only (05/06/07) for orders — confirmation happens on WhatsApp.

## Known issues
- The atelier loads the latest 1000 orders (the Data API's default page size); stats and the calendar are computed on those. Fine for years at the current volume — add server-side stats/pagination if it ever matters.
- Changing the WhatsApp number needs a site edit (it is printed in many places and in the JSON-LD); it is no longer offered in the atelier settings.
- Realtime, storage RLS and phone notifications were only exercised against the mock (no websocket there → polling path). Re-check them on the real project at go-live.
- No password-reset flow in the atelier: reset the owner password from the Supabase dashboard.
- Pre-existing: in French, at tablet widths (~641–700 px and ~1021–1150 px) the long nav button "Commander sur WhatsApp" still touches the logo name. Fix needs a copy decision (shorter FR label) — not changed.
- "How to order" section copy still describes the WhatsApp-only flow; worth updating once Supabase is live.
- The cart (box + form) lives in localStorage for 14 days on the visitor's device; the inspiration photo itself is not kept (must be re-picked after a reload).
- With a configured but unreachable database, the live catalog gives up after ~6 s (supabase-js retries); the static page is shown meanwhile, so visitors see no difference.

## Where things live
- Prices/flavors: `supabase_schema.sql` seed · `js/dy-data.js` LOCAL · static placards + JSON-LD in `index.html` (keep in sync until Supabase is live; afterwards the admin is the source of truth).
- Schema tests: `tools/schema-test` (PGlite, in-memory Postgres with Supabase stubs) — `npm install` then `npm test` there; 87/87 on 2026-10-19. Re-run after every schema change.
- Live-mode test: `tools/mock_supabase.py` (launch config `dori-yums-mock-supabase`, port 4175) — serves the site + fake Supabase answers.
