# SHEmakes redesign — Shopify theme layer

This is the **Boho Dream** theme export with a redesign layer added on top.
Liquid only — no backend, no framework. It restyles the theme rather than
forking it, so it can be reviewed and reverted cheaply.

## What was added

| File | What it is |
|---|---|
| `assets/shemakes.css` | The whole design system — palette, type scale, shapes — plus styles for the new sections. Loaded **after** `base.css`, so it overrides rather than replaces. |
| `assets/shemakes.js` | ~40 lines. Scroll reveals only; everything else is CSS. |
| `sections/sm-ticker.liquid` | The claims ticker that replaces the static announcement bar. |
| `sections/sm-hero.liquid` | Hero with two buttons and the stats card that straddles its bottom edge. |
| `sections/sm-promises.liquid` | The four promises row. |
| `templates/index.shemakes.json` | A **preview** homepage. |
| `layout/theme.liquid` | Two added lines for the CSS and JS, plus the Google Fonts link. |

Nothing else was modified. `index.json` and its 25 existing sections are
untouched, and the live homepage still renders exactly as it does today.

## How to preview it

1. Upload this folder as a **new unpublished theme** (Online Store → Themes →
   Add theme → Upload zip). Never onto the live one.
2. Preview the theme, then visit **`/?view=shemakes`**.

That URL renders the redesigned homepage. Drop the `?view=` and you get the
current one, in the same theme — which is the quickest way to compare them.

## It is all editable in the theme editor

Every section carries a schema, so the client edits it where they already work
— Customize → the section — with no developer involved:

- **Ticker** — one claim per block, add/remove/reorder, and a loop-speed slider
- **Hero** — photograph, location line, heading, body, both buttons, rating
  line, and up to three statistics as blocks
- **Promises** — four blocks, each with an icon, title and body

The stats and promises are **blocks**, so they can be reordered by dragging or
removed entirely.

## Choosing the hero photograph

It sits behind the heading, so: calm, evenly lit, one consistent background. A
**blank** garment beats a printed one — a printed design competes with the type
for attention, which is what the current homepage banner does.

## What is not done yet

Still to port from the approved design: browse/collection filters, the product
page, the cart's free-shipping progress bar, the process strip, the picture-review
wall, the FAQ block and the footer.

The custom-order artwork flow is the one piece that cannot be pure Liquid — file
validation needs a server. Options, cheapest first: keep UploadKit; or call the
existing `ArtworkCheck` service as a small API from a React island.

## Reverting

Delete the two `shemakes.*` lines from `layout/theme.liquid`. The theme is
stock Boho Dream again; the new sections simply sit unused.
