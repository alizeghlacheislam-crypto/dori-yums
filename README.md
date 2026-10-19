# Dori Yums — Maison de Macarons · Algiers

Single-page site for **Dori Yums**, a home-based atelier for handmade and custom macarons in Algiers, Algeria.

- **Stack:** static `index.html` (HTML + CSS + JS), a small data layer `js/dy-data.js`, one Vercel function `api/config.js` — no build step.
- **Languages:** English (default), French, and Arabic (MSA) — copy only. Layout stays LTR in all three; Arabic uses Amiri/Tajawal glyphs and Latin digits.
- **Themes:** light "Maison" (cream / rose / berry, default) and dark "Gallery" (night walls, gold frames).
- **Ordering:** per-flavor modal (quantity presets 20/40/60/80 plus ±20 steps, tiered pricing, name / +213 phone / 58-wilaya form) that opens WhatsApp (`+213 551 401 704`). All WhatsApp messages are generated in French regardless of UI language. Socials: Instagram [@dori_yums](https://instagram.com/dori_yums), [Facebook](https://www.facebook.com/share/1BqEueMstJ/?mibextid=wwXIfr).
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
| `tools/` | Dev only (not deployed): `schema-test/` (SQL checks on in-memory Postgres), `mock_supabase.py` (fake Supabase for local testing) |

## Connecting Supabase

1. Create a Supabase project; open **SQL Editor**, paste `supabase_schema.sql`, run.
2. **Authentication → Users → Add user** for the owner, then run the `insert into private.admin_users …` line from the top of the SQL file with that e-mail. Turn off public sign-ups.
3. In Vercel → Project → **Settings → Environment Variables**, add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (anon or publishable key — never the service_role/secret key), then redeploy.

## Content notes for the client

- **Prices** appear only inside the order modal. Until Supabase is live, unit prices (DZD) live in three places to keep in sync: `data-price` on each card's order link, the JSON-LD menu in `<head>`, and `LOCAL.flavors` in `js/dy-data.js`. Once Supabase is live, the `flavors` table is the source of truth. Tiers: base under 60 pcs, −5 DZD/pc from 60, −10 DZD/pc from 120 (flat) — `site_settings.pricing`.
- **Testimonials** show real Instagram comment screenshots (`assets/testimonial-*.jpg`, cropped to avatar + username + comment). To add more, drop another cropped capture in `assets/` and duplicate a `.quote` figure — the grid wraps to extra rows automatically (with Supabase: add a `gallery_posts` row, category `testimonial`).
- **Policies** (storage, changes & cancellation 48 h / 5 days for custom events) are starting values: confirm them, then update the FAQ, the modal note and the FAQ JSON-LD together.

## Deploy

Static hosting — push to GitHub, import into Vercel (no framework preset, output = root). `api/` is picked up automatically as a serverless function; `.vercelignore` keeps the SQL, docs and tools out of the published site.
