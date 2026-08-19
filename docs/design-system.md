# Design system

## Direction

The references are Mercado Livre and Amazon BR. What we take from them is
structural, not cosmetic:

- A saturated brand band pinned to the top of every page, holding the logo,
  search, and account. It never changes color between pages. It is the reader's
  fixed reference point.
- A neutral content field below it. White cards floating on warm light gray, ML
  style. The page supplies almost no color; product photography supplies all of it.
- Price as the typographic hero of a product card — larger and heavier than the
  product title.
- Color is semantic and load-bearing. Brass means "act". Green means "you save".
  Red means "something is wrong". Nothing is colored for decoration.
- Every row of products has a heading and a uniform card size. There is no
  undifferentiated wall of products anywhere in this app.
- Facet filters live in a persistent left rail on listing pages.

What we explicitly reject, per the brief:

- No more than two badges on a product card, drawn from a fixed vocabulary.
- No interstitials, no modals on load, no auto-advancing carousels.
- Sponsored placements appear only in an explicitly labelled row, never
  interleaved with organic results.
- Card dimensions are uniform within a section. The grid never breaks.

## Color tokens

Defined in `app/src/style.css` under Tailwind v4's `@theme`. Names are semantic,
not literal — never reference a color by its hue.

```css
@theme {
  /* Brand band — deep petrol, from amp tolex */
  --color-band:        #0E3B3E;
  --color-band-hover:  #14504F;
  --color-band-sub:    #16585A;  /* secondary nav strip */
  --color-on-band:     #F4F2ED;

  /* Action — brass hardware / tube glow. Dark ink sits on it, never white. */
  --color-action:       #D68A0C;
  --color-action-hover: #BE7A08;
  --color-action-quiet: #FBF0DA;  /* tinted backgrounds, selected filter rows */
  --color-on-action:    #1B1E1D;

  /* Savings, trust, in-stock */
  --color-gain:       #0E7A4A;
  --color-gain-quiet: #E4F2EA;

  /* Errors, destructive actions, out of stock */
  --color-fault:       #B3261E;
  --color-fault-quiet: #FBE9E8;

  /* Surfaces */
  --color-field:   #F0EFEC;  /* page background, cards float on this */
  --color-surface: #FFFFFF;  /* cards, rails, header of listing */
  --color-sunken:  #E6E4DF;  /* image placeholder, disabled input */

  /* Text */
  --color-ink:    #1B1E1D;
  --color-muted:  #63706E;
  --color-faint:  #8D9895;

  /* Lines */
  --color-line:       #DCDAD5;
  --color-line-heavy: #C3C0B9;

  /* Rating stars only */
  --color-star: #E0A100;
}
```

Contrast requirements: `--color-on-action` on `--color-action` and `--color-ink`
on `--color-field` must both clear 4.5:1. Do not put white text on brass.

## Typography

Two families. Both from Google Fonts, self-hosted via `@fontsource-variable`.

**Archivo Variable** — UI and body. A workhorse grotesque with a width axis. The
width axis is the display move: section headings and the wordmark use
`font-stretch: 112%` with tight tracking; body text stays at 100%. Same family,
two voices. Do not add a third family for headings.

**IBM Plex Mono** — data only. SKUs, order numbers, the card spec strip, spec
tables on the product page, and anything a test will assert against. Never body copy.

```
display-lg   32px / 36px  700  stretch 112%  tracking -0.02em
display      24px / 28px  700  stretch 112%  tracking -0.015em
heading      18px / 24px  600  stretch 100%
body         15px / 22px  400
body-sm      13px / 18px  400
label        12px / 16px  600  tracking 0.04em  uppercase
mono         12px / 16px  450  IBM Plex Mono  tracking 0.02em
```

All numerals use `font-variant-numeric: tabular-nums`. Prices must not shift
width as digits change.

### Price treatment

The one place typography gets loud. Brazilian format, `R$ 1.299,90`:

- `R$` at 13px, `--color-muted`, 4px gap
- integer part at 26px, 700 weight, `--color-ink`
- decimal separator and cents at 15px, 700, baseline-aligned — **not** superscript.
  Amazon superscripts; we don't, because at our card density it reads as noise.
- original price, when discounted, above at 13px, `--color-faint`, strikethrough
- discount percentage beside the price, 13px 600, `--color-gain`

Format through `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
in a single `formatPrice()` helper. Never hand-build a price string.

## Layout

- Page max width 1400px, 24px gutters, 16px on mobile.
- Listing pages: 264px fixed filter rail, 24px gap, fluid results grid.
- Results grid: 5 columns ≥1280px, 4 ≥1024px, 3 ≥768px, 2 below. Cards are equal
  height within a row, image box is a fixed 1:1 ratio with `object-fit: contain`
  on `--color-surface` — gear photos are shot on white and must not be cropped.
- Card radius 6px, `1px solid --color-line`, no shadow at rest. On hover, border
  goes `--color-line-heavy` and the card lifts with
  `box-shadow: 0 2px 8px rgb(14 59 62 / 0.10)`. That is the only shadow in the app.
- Spacing ramp: 4 / 8 / 12 / 16 / 24 / 32 / 48. Nothing between.

## The signature element

**The spec strip.** Every product card, and the header of every product page,
carries a single line of IBM Plex Mono directly under the price:

```
2019 · SEMINOVO · SP · PLATINA
```

Year, condition, seller state, seller tier — separated by middots, uppercase,
12px, `--color-muted`. In a used-gear marketplace these four facts are what
actually decides a purchase, and putting them in mono makes them read as
specification rather than marketing. It is the one element that should feel
unmistakably like this app and not a generic store.

Seller tier is also rendered as a small chevron mark beside the seller name on the
product page and seller page: one chevron for Prata, two for Ouro, three for
Platina, in `--color-action`. Tier vocabulary is fixed: `PRATA`, `OURO`, `PLATINA`,
or absent for untiered individual sellers.

## Badge vocabulary — fixed, maximum two per card

| Badge | Color | Condition to show |
|---|---|---|
| `FRETE GRÁTIS` | gain on gain-quiet | product qualifies for free shipping |
| `-XX%` | gain on gain-quiet | `listPrice > price` |
| `ÚLTIMA UNIDADE` | fault on fault-quiet | `stock === 1` |
| `ESGOTADO` | muted on sunken | `stock === 0` |
| `PATROCINADO` | faint, outline only | sponsored row only |

Priority when more than two apply: `ESGOTADO` > `ÚLTIMA UNIDADE` > `-XX%` >
`FRETE GRÁTIS`. Never render a third.

## Motion

Sparse and functional. 150ms ease-out on hover states, 200ms on the cart drawer
slide, 120ms cross-fade on skeleton-to-content. Nothing else animates. All of it
is disabled under `prefers-reduced-motion: reduce`.

## Required states

Every list surface implements four distinct renders, each with its own testid:

- **loading** — skeleton cards matching the real grid geometry, `data-testid="results-skeleton"`
- **empty** — `data-testid="results-empty"`, names the active filters and offers to clear them
- **error** — `data-testid="results-error"`, states what failed and offers retry
- **content** — `data-testid="results-grid"`

Empty and error copy explains what happened and what to do next. Errors do not
apologize and are never vague.
