# Dori Yums — Maison de Macarons · Algiers

Single-page site for **Dori Yums**, a home-based atelier for handmade and custom macarons in Algiers, Algeria.

- **Stack:** one self-contained `index.html` (HTML + CSS + JS), no build step.
- **Languages:** English (default) with a French toggle — copy only, same type system.
- **Themes:** light "Maison" (cream / rose / berry, default) and dark "Gallery" (night walls, gold frames).
- **Ordering:** WhatsApp click-to-chat (`+213 551 401 704`) with localized pre-filled messages; Instagram [@dori_yums](https://instagram.com/dori_yums).

## Structure

| Path | Purpose |
|---|---|
| `index.html` | The entire site — tokens, markup, i18n dictionary, interactions |
| `assets/` | Logo, hero, 12 macaron flavor renders, atelier photography (webp) |
| `icons/` | PWA / touch icons |
| `manifest.webmanifest` | PWA manifest (rose/cream palette) |

## Content notes for the client

- **Prices** are intentionally not shown — every card routes to WhatsApp.
- **Testimonials** section contains clearly-marked reserved slots; replace each `.quote` block with real client reviews when available.
- **FAQ answers** avoid concrete lead times / payment methods until confirmed; tighten them once policies are fixed.

## Deploy

Static hosting — push to GitHub, import into Vercel (no framework preset, output = root).
