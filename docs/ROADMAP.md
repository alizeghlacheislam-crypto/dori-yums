# Dori Yums — Roadmap (direct ordering + owner admin)

Golden rule for every milestone: additive changes on top of the existing site — identity,
colors, fonts (Cormorant Garamond, Inter, Amiri, Tajawal), imagery and FR/EN/AR stay 100%
intact, and the site must keep working with no Supabase keys (local fallback).

| ID | Milestone | Status |
|---|---|---|
| M1 | SEO, performance, standard files, policies | ✅ done 2026-10-19 |
| M2 | Supabase schema + RLS + seed, data layer with local fallback | ✅ done 2026-10-19 |
| M3 | Customer ordering: announcement bar, holiday mode, sold-out badges, box builder, checkout, tracking | ✅ done 2026-10-19 |
| M4 | Owner admin PWA (`/admin`): orders realtime, baking calendar, flavors/gallery CMS, settings, promos, stats | ⏳ next |

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

## M4 — Admin PWA (next)
- Recommendation (decide at M4 start): same no-build stack as the site (static `admin.html` + vanilla JS + supabase-js from CDN), own manifest + service worker — one deployment, no build step. Alternative: React + Vite in a sub-folder (needs a build step on Vercel).
- Supabase Auth login (owner only via `private.admin_users`), realtime orders with sound, filters, status buttons, call/WhatsApp; baking calendar (pieces per flavor per date); flavors + gallery CMS with uploads; settings, promo codes, stats.
- `vercel.json`: `cleanUrls` so `/admin` serves `admin.html`.
