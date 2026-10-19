# Dori Yums — Roadmap (direct ordering + owner admin)

Golden rule for every milestone: additive changes on top of the existing site — identity,
colors, fonts (Cormorant Garamond, Inter, Amiri, Tajawal), imagery and FR/EN/AR stay 100%
intact, and the site must keep working with no Supabase keys (local fallback).

| ID | Milestone | Status |
|---|---|---|
| M1 | SEO, performance, standard files, policies | ✅ done 2026-10-19 |
| M2 | Supabase schema + RLS + seed, data layer with local fallback | ✅ done 2026-10-19 |
| M3 | Customer ordering: announcement bar, holiday mode, sold-out badges, box builder, checkout, tracking | ✅ done 2026-10-19 |
| M4 | Owner admin PWA (`/admin`): orders realtime, baking calendar, flavors/gallery CMS, settings, promos, stats | ✅ done 2026-10-19 |

## M1 — SEO & standards ✅
- Head: canonical, robots, geo (DZ-16), full OpenGraph/Twitter, JSON-LD (WebSite + Bakery with 12-item `hasMenu` in DZD + FAQPage).
- `robots.txt`, `sitemap.xml` (with image entries), cache headers in `vercel.json`.
- Storage policy + change/cancellation FAQ (EN/FR/AR) and a short policy note at the end of the order modal.
- **Acceptance (verified):** JSON-LD parses; menu prices = placard `data-price`; FAQ JSON-LD = visible answers; robots/sitemap served; Arabic punctuation renders correctly.

## M2 — Backend & fallback ✅
- `supabase_schema.sql`: flavors, gallery_posts, orders (+ order_status_log), promo_codes, site_settings; explicit grants + RLS; `place_order` / `track_order` / `validate_promo` functions; storage buckets; realtime; seed.
- `js/dy-data.js` (window.DY), `api/config.js`, page hydration in `index.html`.
- **Acceptance (verified):** 87/87 database checks on PGlite (anon / stranger / admin); no-keys mode identical to before; mock-Supabase mode renders DB data in the same markup, follows the language switch and uses DB price tiers; unreachable database → local data, `network` errors.

## M3 — Customer ordering ✅
- Announcement bar (dismissible) from `site_settings.announcement`; holiday mode banner + disabled submit from `site_settings.holiday_mode`.
- Sold-out badge (EN/FR/AR) for `is_available = false`, card kept in the grid, order button disabled.
- Order modal → box builder: box size from `ordering.box_sizes`, per-flavor +/- by `ordering.flavor_step`, progress "X of Y", live total with tiers + promo (`DY.validatePromo`).
- Checkout: name, Algerian mobile validation, wilaya + commune, delivery/pickup with fee from `site_settings.delivery`, event date (≥ `min_lead_days`), inspiration upload (`DY.uploadInspiration`), notes; cart saved in localStorage; clear offline/error messages for every `place_order` error key.
- Success screen: tracking code, summary, optional WhatsApp copy. Without keys: fall back to the current WhatsApp flow.
- Tracking dialog: code + phone → status steps (pending → confirmed → baking → completed).
- **Acceptance (verified 2026-10-19):** every `place_order` error key maps to a translated message (EN/FR/AR); no-keys mode builds the box and opens a French WhatsApp message; mock mode: promo, photo upload, order DY-1043, success screen, WhatsApp copy, tracking timeline; holiday mode disables sending; offline / network errors keep the box and reuse the same request id; box restored after reload; 375 px layout fits; Arabic bidi checked; `#track=DY-…` links open tracking.
- Nav: tracking icon shown on phones and ≥ 1241 px; in between it is in the burger menu + footer. The "Algiers" label beside the logo is hidden ≤ 1240 px (it overflowed the menu).

## M4 — Admin PWA ✅
- Stack (owner decision 2026-10-19): no build step — `admin.html` + `js/admin.js` + supabase-js through `js/dy-data.js`; `admin.webmanifest` + `admin-sw.js` (scope `/admin`); `vercel.json` `cleanUrls` → `/admin`.
- Login with Supabase Auth; access only when `is_admin()` is true (RLS does the real enforcement); session kept on the device.
- Orders: list with per-status filters and search, one-tap next status, call / WhatsApp (French message), details with items, totals, notes, signed URL for the private inspiration photo, status history. New orders: chime (Web Audio), vibration, toast, tab badge, title counter, system notification when the app is in the background. Realtime channel on `orders`, polling every 20 s when realtime is not connected (2 min safety poll otherwise).
- Baking calendar: pieces per flavor for the next 7/14/30 days, per delivery date, optional pending orders, overdue section.
- Flavors CMS: add/edit (3 languages, price or base price, numeral), photo upload (auto-resized), availability switch, reorder, delete. Gallery & testimonials CMS: same, per section.
- Settings: stats (orders, sales excl. cancelled, this month, average, top flavors), prices & tiers, ordering rules, delivery fees per wilaya, announcement bar, holiday mode, promo codes (create, activate/deactivate).
- **Acceptance (verified on the mock backend 2026-10-19):** wrong password / non-admin / owner login paths; status change + history; new order detected and announced; calendar totals checked by hand; flavor edit with a 3000 px photo → 1600 px WebP upload; add/validate/reorder/delete flavor; gallery add/reorder/delete (storage object removed); every settings form saved and **reflected on the public site** (sold-out badge, price, tiers note, box sizes, lead days, delivery fees, holiday mode); promo create/deactivate/duplicate refused; Arabic UI; 375 px layout without overflow on all tabs.
- **Independent review (2026-10-19):** 17 findings (no critical); all confirmed ones fixed and re-tested — invalid settings combinations refused, number typos refused, offline screen from the installed app, session-expired path, GIF→WebP / HEIC message, drawer no longer reloads on every refresh.
- **Not verifiable without a real Supabase project:** the realtime channel itself (the mock has no websocket — the polling fallback was what ran), real RLS on storage, push of system notifications on a phone, the chime's audio output.

## Go-live checklist (owner + Supabase account needed)
1. Supabase: new project → SQL Editor → run `supabase_schema.sql`.
2. Authentication → Users → add the owner; run the `insert into private.admin_users …` line with that e-mail; turn off public sign-ups.
3. Vercel → Settings → Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY` → redeploy.
4. Open `/admin` on the owner's phone → sign in → "Add to Home screen"; turn the bell on once (the browser needs one tap to allow sound / notifications).
5. Place one real test order on the site, watch it arrive in the atelier, move it through the statuses, track it on the site, then cancel it.
