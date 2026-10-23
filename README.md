# Dori Yums — Maison de Macarons · Algiers

Single-page site for **Dori Yums**, a home-based atelier for handmade and custom macarons in Algiers, Algeria.

- **Stack:** static `index.html` (HTML + CSS + JS), a small data layer `js/dy-data.js`, one Vercel function `api/config.js` — no build step.
- **Languages:** English (default), French, and Arabic (MSA) — copy only. Layout stays LTR in all three; Arabic uses Amiri/Tajawal glyphs and Latin digits.
- **Themes:** light "Maison" (cream / rose / berry, default) and dark "Gallery" (night walls, gold frames).
- **Ordering:** box builder (box sizes from settings + ±20, several flavors per box by steps of 5, live tiered pricing) → checkout (name, Algerian mobile check, delivery or pickup with the wilaya fee, commune, event date, inspiration photo, allergies/notes, promo code) → confirmation with a `DY-XXXX` tracking code and an optional WhatsApp copy. With Supabase the order is saved through `place_order()`; without it the same flow opens WhatsApp (`+213 551 401 704`). Tracking dialog: "Track my order" (nav icon, burger menu, footer) or a `#track=DY-1042` link. The box is kept on the device until sent. All WhatsApp messages are generated in French regardless of UI language.
- **Announcement bar / holiday mode:** driven by `site_settings.announcement` and `site_settings.holiday_mode` (holiday mode also disables sending orders); dismissible per message.
- **Socials:** Instagram [@dori_yums](https://instagram.com/dori_yums), [Facebook](https://www.facebook.com/share/1BqEueMstJ/?mibextid=wwXIfr).
- **Atelier (owner admin):** `/admin` — installable on the phone; sign-in with the Supabase owner account, plus a 6-digit code from an authenticator app once it is turned on (setup, recovery and the `sql/` files: `docs/ADMIN-SECURITY.md`).
- **Backend (optional):** Supabase. Without keys the site runs on its built-in catalog exactly as before; with keys, flavors, gallery, testimonials and price tiers come from the database. Roadmap and state: [`docs/`](docs/ROADMAP.md).

## Structure

| Path | Purpose |
|---|---|
| `index.html` | The site — tokens, markup, i18n dictionary, SEO/JSON-LD, interactions, live-catalog rendering |
| `js/dy-data.js` | Data layer (`window.DY`): Supabase when configured, local catalog otherwise; order / tracking / promo / upload calls |
| `api/config.js` | Vercel function: passes the public `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars to the browser (refuses secret keys) |
| `supabase_schema.sql` | Tables, RLS, order functions, storage buckets, realtime, seed — run once in the Supabase SQL Editor (re-runnable) |
| `assets/` · `icons/` | Imagery (webp) · PWA / touch icons |
| `robots.txt` · `sitemap.xml` · `manifest.webmanifest` · `vercel.json` | Crawling, PWA, cache headers |
| `admin.html` · `js/admin.js` · `admin-sw.js` · `admin.webmanifest` | Owner atelier (PWA at `/admin`): orders in real time, baking calendar, flavors & gallery CMS, settings, promo codes, stats |
| `tools/` | Dev only (not deployed): `schema-test/` (SQL checks on in-memory Postgres), `mock_supabase.py` (fake Supabase for local testing) |

## Connecting Supabase

1. Create a Supabase project; open **SQL Editor**, paste `supabase_schema.sql`, run.
2. **Authentication → Users → Add user** for the owner, then run the `insert into private.admin_users …` line from the top of the SQL file with that e-mail. Turn off public sign-ups.
3. In Vercel → Project → **Settings → Environment Variables**, add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (anon or publishable key — never the service_role/secret key), then redeploy.

## Content notes for the client

- **Prices** appear only inside the order modal. Until Supabase is live, unit prices (DZD) live in three places to keep in sync: `data-price` on each card's order link, the JSON-LD menu in `<head>`, and `LOCAL.flavors` in `js/dy-data.js`. Once Supabase is live, the `flavors` table is the source of truth. Tiers: base under 60 pcs, −5 DZD/pc from 60, −10 DZD/pc from 120 (flat) — `site_settings.pricing`.
- **Testimonials** show real Instagram comment screenshots (`assets/testimonial-*.jpg`, cropped to avatar + username + comment). To add more, drop another cropped capture in `assets/` and duplicate a `.quote` figure — the grid wraps to extra rows automatically (with Supabase: add a `gallery_posts` row, category `testimonial`).
- **Policies:** storage advice is a starting value; the payment conditions are the owner's (2026-10-23): full amount or 50 % deposit, balance within five days of the "ready" notice, unpaid deposit not refunded — the customer ticks them before "Continue". The five days are a payment deadline, not a lead time (the lead time is `site_settings.ordering.min_lead_days`). When a policy changes, update the conditions block, the order-window note, the FAQ and the FAQ JSON-LD together, in the three languages.

## Deploy

Static hosting — push to GitHub, import into Vercel (no framework preset, output = root). `api/` is picked up automatically as a serverless function; `.vercelignore` keeps the SQL, docs and tools out of the published site.
