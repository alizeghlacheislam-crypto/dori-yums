# Dori Yums — Maison de Macarons · Algiers

Single-page site for **Dori Yums**, a home-based atelier for handmade and custom macarons in Algiers, Algeria.

- **Stack:** one self-contained `index.html` (HTML + CSS + JS), no build step.
- **Languages:** English (default), French, and Arabic (MSA) — copy only. Layout stays LTR in all three; Arabic uses Amiri/Tajawal glyphs and Latin digits.
- **Themes:** light "Maison" (cream / rose / berry, default) and dark "Gallery" (night walls, gold frames).
- **Ordering:** per-flavor modal (quantity presets 20/40/60/80 plus ±20 steps, tiered pricing, name / +213 phone / 58-wilaya form) that opens WhatsApp (`+213 551 401 704`). All WhatsApp messages are generated in French regardless of UI language. Socials: Instagram [@dori_yums](https://instagram.com/dori_yums), [Facebook](https://www.facebook.com/share/1BqEueMstJ/?mibextid=wwXIfr).

## Structure

| Path | Purpose |
|---|---|
| `index.html` | The entire site — tokens, markup, i18n dictionary, interactions |
| `assets/` | Logo, hero, 12 macaron flavor renders, atelier photography (webp) |
| `icons/` | PWA / touch icons |
| `manifest.webmanifest` | PWA manifest (rose/cream palette) |

## Content notes for the client

- **Prices** appear only inside the order modal. Base unit prices (DZD) were carried over from the v1 catalog (`data-price` on each card's order link): adjust them there if they change. Tiers: base under 60 pcs, −5 DZD/pc from 60, −10 DZD/pc from 120 (flat).
- **Testimonials** section contains clearly-marked reserved slots; replace each `.quote` block with real client reviews when available.
- **FAQ answers** avoid concrete lead times / payment methods until confirmed; tighten them once policies are fixed.

## Deploy

Static hosting — push to GitHub, import into Vercel (no framework preset, output = root).
