# DESIGN.md — SHEmakes Transfers, Shopify theme

> Scope: the Shopify theme in this folder. The repo root `DESIGN.md` still
> describes the Laravel prototype's world and is unchanged; the two apps have
> deliberately parted company here.

## Overview

This is a print shop, and the site is built like one.

The world it replaces was a boutique: oversized pastel panels with 20px
corners, ellipse wave dividers between sections, a pill on every button, and
air used as the main structural device. It was pleasant and it was anonymous —
the same arrangement any storefront theme arrives with, wearing a different
palette.

What a print shop looks like instead: **ruled, measured, and specific.** Sections announce themselves with a
monospaced spec label the way a job ticket does. Numbers are set to be
compared — tabular, aligned, never decorative. Corners are small because paper
and film have edges. Density is deliberate: a shop that prints twenty-three
sheets a day does not have room to waste, and the page should feel like it
knows that.

The palette does not change and the typefaces do not change. Raspberry still
carries every action, butter cream and blush still carry the bands, Playfair
still sets the headlines and Satoshi still sets everything read as interface.
What changes is every decision about *shape* — and shape is what made the old
site read as a template.

**Key characteristics:**

- **A band is entered through a wave.** Pinned by the shop. One traced shape,
  used as a mask, filled with `background: inherit` — so it is never a colour
  in the stylesheet, it is the ink of the band it leads into. The same wave
  carries cream, honey, blush and the dark block, and follows the palette when
  the appearance editor re-points it. Height 54 / 88 / 120px by breakpoint.
- **Small corners.** 4px on controls, 6px on cards, 2px on image frames. The
  pill survives in exactly one place: chips and badges, where the shape is a
  label, not a button.
- **Mono is measurement.** JetBrains Mono carries spec labels, sizes, counts,
  turnaround, SKU-like taxonomy. It never sets a sentence.
- **Tabular figures everywhere a number can be compared** — prices, inches,
  counts, ratings.
- **Bands stay, framing changes.** The colour blocks that carry a page's
  rhythm remain, in the shop's own five colours. They are entered through the
  wave and opened by a spec label.
- **Registration marks** at band corners: a 10px corner tick, the mark a
  printer aligns a sheet by. One per band, top-left, in the band's own ink.

## Colours

Unchanged from the shop's palette and still driven from
**Theme settings → SHEmakes colours**. Every value below is a token; the
stylesheet never names a hex.

| Token | Role |
|---|---|
| `--sm-brand` | Raspberry. Every action, price, selected state, dark band. |
| `--sm-signal` | Lipstick. Sale, rush, add to cart, review stars. |
| `--sm-ink` | Headlines and body. Hairlines and shadows are mixed from it. |
| `--sm-ink-muted` / `--sm-ink-faint` | Captions and meta. `faint` holds 4.9:1. |
| `--sm-shell` | Canvas. |
| `--sm-paper` | Soft surface: chips, icon buttons, hover fills. |
| `--sm-block-cream` / `--sm-block-honey` / `--sm-block-sand` / `--sm-blush` | The bands. |
| `--sm-block-sage` | Panel sitting on a band. |

White canvas between bands. Never two bands of the same ink in a row.

## Typography

Unchanged families: **Playfair Display** for headings, **Satoshi** for
interface and body, **JetBrains Mono** for measurement.

What changes is the mono's job. It was decoration on an eyebrow; it is now the
shop's taxonomy layer — the label on the job ticket. It appears as:

- **Spec label** — 11px, uppercase, 0.12em tracking, above a band's heading.
  Carries the section's own fact, not a category name: `SHEET 22×24″`,
  `SAME DAY · NEXT DAY`, `5 QUESTIONS`.
- **Figures** — prices, inches, counts, review scores, all `tabular-nums`.

Headings keep Playfair and keep their existing sizes. Body keeps Satoshi.

## Shape

| Token | Value | Use |
|---|---|---|
| `--sm-radius-card` | 6px | Cards, bands, panels, media frames |
| `--sm-radius-field` | 4px | Inputs, buttons, menu items |
| `--sm-radius-pill` | 999px | Chips and badges only — never a button |

No blob radii. The divider between bands is the shop's wave, described above;
what the redesign removed was the *soft everything* around it — the 20px
corners, the pill on every control, the float under every card. The wave is a
deliberate mark against a ruled, squared page, which is why it reads now and
did not before.

## Elevation

Shadow-light, more so than before. A band is separated by a rule and a colour
change, not by a float.

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat | Bands, hero, footer — the default |
| 1 | 1px `--sm-line-soft` | Cards, inputs, table rows |
| 2 | `0 2px 8px` from ink at 8% | Menus, drawers, the cart panel |
| 3 | `--sm-shadow-panel` + scrim | Modals and lightboxes only |

## Motion

One authored moment per surface, exponential ease-out from an already visible
default. No entrance animation repeated on every section. Hover moves an
affordance by 2–3px and nothing else.

## What is preserved

Pinned by the shop and not open for redesign: the SHE MAKES lockup and the
butterfly, the raspberry-and-cream palette, Playfair and Satoshi, and the
order of sections on every page. Product facts, copy, prices, collections and
the checkout flow are product truth and are untouched.
