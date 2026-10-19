# Session state

**PROJECT:** Dori Yums — upgrade of the existing static site into a direct-ordering platform + owner admin PWA (Supabase).
**GOAL:** customers order and track online; the owner manages orders, catalog and settings from a phone.
**DEFINITION OF DONE:** M1–M4 in [ROADMAP.md](ROADMAP.md) meet their acceptance criteria; the site still works with no Supabase keys.
**NON-GOALS:** redesign, new stack for the public site, online payment.

**CURRENT MILESTONE:** M3 (customer ordering) — not started.
**LAST COMPLETED STEP:** M2 — schema, data layer, hydration (2026-10-19).
**NEXT STEP:** M3 announcement bar + holiday mode, then sold-out badges, box builder, checkout, tracking.
**BLOCKERS:** none. Real Supabase keys are not needed until go-live (mock: `python tools/mock_supabase.py`).

## Decisions
- D1 (2026-10-19) Keep the no-build static architecture (index.html + js/ + one Vercel function). Reason: owner rule "modify, don't rebuild"; zero risk to the design.
- D2 Per-flavor unit prices kept (`flavors.price`, as on the v1 site); `pricing.base_unit_price` only applies to flavors with no price.
- D3 Orders are written only through `place_order()` (SECURITY DEFINER), which recomputes every price, tier, fee and discount; the browser never sends prices. Tracking only through `track_order(code, phone)`.
- D4 Owner = Supabase Auth user listed in `private.admin_users`; public sign-ups must be disabled.
- D5 Tier rule: the tier with the highest `min_qty` reached by the WHOLE box applies to every piece (same in SQL and in the page).
- D6 Public Supabase keys reach the browser through `/api/config` (env vars `SUPABASE_URL`, `SUPABASE_ANON_KEY`); a secret key is refused.

## Assumptions — to confirm with the owner
- A1 Delivery fees: Alger 500 DZD, other wilayas 1000 DZD, pickup free (`site_settings.delivery`).
- A2 Change/cancellation: free up to 48 h before the date; fully custom event orders up to 5 days (FAQ + modal + JSON-LD).
- A3 Storage: fridge ~4 °C, best within 3 days, max 5 days, out 15–20 min before serving.
- A4 Ordering rules: boxes in steps of 20 (min 20, max 1000), flavors in steps of 5 inside a box, order at least 2 days ahead.
- A5 Mobile numbers only (05/06/07) for orders — confirmation happens on WhatsApp.

## Known issues
- With a configured but unreachable database, the live catalog gives up after ~6 s (supabase-js retries); the static page is shown meanwhile, so visitors see no difference.

## Where things live
- Prices/flavors: `supabase_schema.sql` seed · `js/dy-data.js` LOCAL · static placards + JSON-LD in `index.html` (keep in sync until Supabase is live; afterwards the admin is the source of truth).
- Schema tests: `tools/schema-test` (PGlite, in-memory Postgres with Supabase stubs) — `npm install` then `npm test` there; 87/87 on 2026-10-19. Re-run after every schema change.
- Live-mode test: `tools/mock_supabase.py` (launch config `dori-yums-mock-supabase`, port 4175) — serves the site + fake Supabase answers.
