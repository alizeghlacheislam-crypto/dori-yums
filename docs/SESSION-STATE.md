# Session state

**PROJECT:** Dori Yums — upgrade of the existing static site into a direct-ordering platform + owner admin PWA (Supabase).
**GOAL:** customers order and track online; the owner manages orders, catalog and settings from a phone.
**DEFINITION OF DONE:** M1–M4 in [ROADMAP.md](ROADMAP.md) meet their acceptance criteria; the site still works with no Supabase keys.
**NON-GOALS:** redesign, new stack for the public site, online payment.

**CURRENT MILESTONE:** none — M1–M4 built; next is go-live (see ROADMAP.md checklist).
**LAST COMPLETED STEP:** M4 — owner atelier PWA at /admin (2026-10-19).
**NEXT STEP:** go-live with a real Supabase project (needs the owner's account), then a real end-to-end test order; nothing is pushed or deployed yet.
**BLOCKERS:** none. Real Supabase keys are not needed until go-live (mock: `python tools/mock_supabase.py`).

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
