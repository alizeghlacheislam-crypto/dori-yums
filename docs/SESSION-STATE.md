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
- Two-step sign-in (D14, 2026-10-23): built and tested locally, **not deployed, rule not applied on production** — follow `docs/ADMIN-SECURITY.md` → *Going live* (deploy → owner sets up the code + a backup → owner runs `sql/2026-10-23-admin-mfa.sql`).

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
- D13 (2026-10-23, owner — **wording superseded by D15**) A conditions block with a checkbox above "Continue" in the box step; "Continue" stays `aria-disabled` until ticked, ticked again for each order, not stored. Its first wording read the 5 days as an order lead time — wrong, see D15; the advice to raise the minimum notice to 5 is withdrawn.
- D14 (2026-10-23, owner approved "option 2" of the security assessment) Atelier two-step sign-in with an authenticator app (Supabase TOTP, free). Enforced in the database: `private.is_admin()` needs `aal2` once the admin has a verified app (password alone still works before that — no lockout); the same function in `supabase_schema.sql` and `sql/2026-10-23-admin-mfa.sql`, with `…-rollback.sql` and `admin-mfa-recovery.sql`. Atelier: code screen, set-up panel (QR + key), backup app, "sign out" = this device, "sign out of all devices"; CSP on `/admin` (no inline script — the language bootstrap moved to `js/admin-lang.js`) and on public pages. Passkeys rejected for now (Supabase: experimental). Guide: `docs/ADMIN-SECURITY.md`. Built partly in a forked session (stopped) and finished here.
- D15 (2026-10-23, owner's clarification) Payment policy, final text in AR/EN/FR: confirm with the full amount or a 50 % deposit; with a deposit the balance is due within five days of being told the order is ready; unpaid by then, the deposit is not refunded (covers preparation costs); "Thank you for your understanding". The five days are a **payment deadline, not a lead time**: preparation guidance (FAQ "how far in advance", `site_settings.ordering.min_lead_days` = 2 in production, read-only check 2026-10-23, last changed 2026-10-20) is untouched. Same text in the conditions block, the order-window note ("Payment & deposit"), the FAQ change/cancel answer (+ the existing WhatsApp change sentence) and its JSON-LD. No automated cancellation, payment enforcement or new refund condition.
- D16 (2026-10-23, owner authorized) Public site: (a) contrast — `--on-accent` #3A1F1F on the rose #E0959E (6.42:1, was 2.25:1) plus the five rules that hard-coded cream on rose; hover stays white on #9C5666 (5.33:1); gallery theme unchanged (8.76:1); the atelier keeps its own styles (not changed). (b) Phones (≤640px): the fixed FB/IG/WA buttons are hidden — measured to cover text and controls while scrolling, even WhatsApp alone (10 of 48 positions at 390×844); the hero/menu/flavor WhatsApp buttons and footer links remain. (c) Arabic is now RTL (`html dir`, set before first paint and on every switch), replacing the historical LTR choice of 2026-07-08: logical properties where a side mattered, the two `unicode-bidi:plaintext` patches removed, arrows mirrored, phone field / order codes / contact number / @handle kept LTR, the moving announcement strip still drifts right → left; thousands now joined by U+202F so "2 400" stays in order in Arabic. (d) Tracking opened from the phone menu returns focus to the menu button on close. The atelier stays LTR in Arabic.

## Assumptions — confirmed by the owner on 2026-10-19 ("القيم المبدئية مقبولة")
- A1 Delivery fees: Alger 500 DZD, other wilayas 1000 DZD, pickup free (`site_settings.delivery`).
- A2 (superseded by D13 on 2026-10-23) Change/cancellation: free up to 48 h before the date; fully custom event orders up to 5 days.
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
