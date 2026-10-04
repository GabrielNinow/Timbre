# Pages and components

## Routes

| Path | Name | Notes |
|---|---|---|
| `/` | home | category rows, one labelled sponsored row |
| `/search` | search | query in URL: `?q=&category=&brand=&condition=&price=&freeShipping=&sort=&page=` |
| `/c/:categorySlug` | category | same component as search, category pinned |
| `/p/:slug--:id` | product | double dash separates slug from id |
| `/s/:sellerSlug` | seller | |
| `/cart` | cart | full page, not a drawer |
| `/checkout/shipping` | checkout-shipping | guarded: auth + non-empty cart |
| `/checkout/payment` | checkout-payment | guarded: shipping step complete |
| `/checkout/review` | checkout-review | guarded: payment step complete |
| `/orders/:id` | order-confirmation | |
| `/sign-in` | login | `?redirect=` supported |
| `/sign-up` | register | |
| `/account/orders` | orders | guarded: auth |

Every filter and pagination change writes to the URL. A listing page must be fully
reconstructible from its URL alone — this is what lets tests deep-link into a
filtered state instead of clicking through the rail.

Guards redirect to `/sign-in?redirect=<encoded>` and return the user to the
intended route after login. Test that round trip.

## Global chrome

**Band header**, `--color-band`, sticky.

```
┌────────────────────────────────────────────────────────────────┐
│  TIMBRE   [ search input ................. 🔍 ]  Entrar  Carrinho(2) │
├────────────────────────────────────────────────────────────────┤
│  Categorias ▾   Ofertas   Vender   Ajuda        Enviar para 89010-000 │
└────────────────────────────────────────────────────────────────┘
```

Sub-strip is `--color-band-sub`. The CEP control on the right opens a popover and
persists to the cart. Cart count is `aria-live="polite"`.

`data-testid`: `site-header`, `search-input`, `search-submit`, `header-account`,
`header-cart`, `cart-count`, `category-menu`, `cep-selector`.

## Home

Stacked sections, each with a heading and a uniform card row. No hero carousel.
The hero slot is instead a single static category tile row — six tiles, one per
category, which is genuinely the most useful thing at the top of a marketplace.

Sections: category tiles, "Ofertas do dia" (8 cards, horizontal scroll on mobile),
"Recém-chegados", "Patrocinados" (labelled, outlined cards), one seller spotlight.

## Search and category listing

```
┌──────────────┬─────────────────────────────────────────────┐
│ FILTROS      │ 128 resultados para "stratocaster"          │
│              │                          [ Ordenar por ▾ ]  │
│ Categoria    │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│ ▸ Guitarras  │ │ card │ │ card │ │ card │ │ card │ │ card ││
│              │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│ Condição     │ ┌──────┐ ┌──────┐ ...                       │
│ ☐ Novo   42  │                                             │
│ ☑ Seminovo 61│                  ‹ 1 2 3 ›                  │
│ ☐ Usado  25  │                                             │
│              │                                             │
│ Marca        │                                             │
│ Preço        │                                             │
│ ☐ Frete grátis│                                            │
└──────────────┴─────────────────────────────────────────────┘
```

- Active filters render as removable chips above the grid, with a "Limpar tudo"
  action. Chips are the fastest thing to assert filter state against.
- Facet counts update from the API response, not client-side.
- Price is a min/max input pair plus preset buckets. Invalid ranges (min > max)
  show inline error and do not fire a request.
- The rail collapses into a full-screen dialog below 768px, triggered by a
  `filter-open` button. That dialog is a teleported Reka UI component — good
  practice for both frameworks.

`data-testid`: `filter-rail`, `filter-group` + `data-facet`, `filter-option` +
`data-value`, `filter-chip` + `data-facet`, `filter-clear-all`, `sort-select`,
`results-count`, `results-grid`, `results-skeleton`, `results-empty`,
`results-error`, `pagination`, `pagination-page` + `data-page`.

## ProductCard

```
┌─────────────────────┐
│                     │
│    [ 1:1 image ]    │
│                     │
├─────────────────────┤
│ FRETE GRÁTIS  -18%  │  ← max 2 badges
│ R$ 1.299,90         │  ← price hero
│ R$ 1.589,00 riscado │
│ 2019·SEMINOVO·SP·PLATINA │  ← mono spec strip, the signature
│ Fender Player Strat │
│ ★★★★☆ 4.6 (89)      │
└─────────────────────┘
```

Whole card is a link. The card does not contain an add-to-cart button — this is a
marketplace, adding happens on the product page. Out-of-stock cards render at 60%
opacity with the `ESGOTADO` badge and remain clickable.

`data-testid="product-card"` plus `data-product-id`. Inner testids:
`product-card-price`, `product-card-title`, `product-card-badge` + `data-badge`,
`product-card-spec-strip`.

## Product page

Two columns above 1024px: gallery left (thumbnail strip, main image, no zoom
modal), details right. Below that, full-width: specs table, description, seller
panel, related products.

The details column, in order: title, rating link, price block, spec strip,
variant selector, stock line, quantity stepper, `Comprar agora` (action) and
`Adicionar ao carrinho` (outline), shipping estimate with CEP input, seller card
with tier chevrons.

Rules:
- Selecting a variant updates price, stock, and the URL query `?opcao=`.
- Quantity stepper is capped at available stock and disables the increment button
  at the cap, with a `stock-limit-notice` message.
- Stock ≤ 3 shows "Últimas N unidades" in `--color-fault`.
- Out of stock replaces both buttons with a disabled state and an "Avise-me"
  input.
- Adding to cart shows a toast with a link to the cart. No modal, no redirect.

`data-testid`: `product-title`, `product-price`, `variant-group`,
`variant-option` + `data-option-id`, `qty-input`, `qty-increase`, `qty-decrease`,
`add-to-cart`, `buy-now`, `stock-notice`, `shipping-cep-input`,
`shipping-quote-submit`, `shipping-options`, `seller-panel`, `seller-tier`,
`add-to-cart-toast`.

## Cart

Full page. Lines left, sticky summary right.

Each line: thumbnail, title, variant, seller name, unit price, quantity stepper,
line total, remove. Lines group under a per-seller heading, because shipping is
quoted per seller in a marketplace — and multi-seller carts are one of the more
interesting checkout scenarios to test.

Summary: subtotal, coupon row with input and apply, shipping method radio,
discount line (only when nonzero), total, `Fechar pedido`.

Coupon errors render inline below the input with `data-testid="coupon-error"` and
a `data-error-code` attribute carrying the API's stable code. Assert on the
attribute, not the text.

Empty cart is its own render: `data-testid="cart-empty"`, with a link back to home.

`data-testid`: `cart-line` + `data-line-id`, `cart-line-remove`, `cart-line-qty`,
`cart-line-total`, `coupon-input`, `coupon-apply`, `coupon-remove`,
`coupon-error`, `summary-subtotal`, `summary-discount`, `summary-shipping`,
`summary-total`, `checkout-submit`, `shipping-method` + `data-method`.

## Checkout

Three routed steps with a persistent progress indicator. Each step is a real URL,
so tests can start mid-flow after seeding state via the API.

1. **Entrega** — address form. CEP field triggers a lookup on blur and populates
   street, district, city, state, which remain editable. `00000000` surfaces a
   field-level error; `99999999` surfaces a form-level error with retry.
2. **Pagamento** — method tabs (card, pix, boleto). Card fields with live
   formatting on number and expiry, Luhn check on blur, CVV length by brand.
3. **Revisão** — read-only summary of both prior steps with "Alterar" links back,
   totals, terms checkbox, `Finalizar compra`.

Validation runs on blur and again on submit. On submit failure, focus moves to the
first invalid field and an error summary renders at the top with
`data-testid="form-error-summary"` and `role="alert"`.

Payment failures return to the review step with `data-testid="payment-error"` and
`data-error-code`. The cart is not cleared. The user can change the card and retry
— test that path, it is where naive implementations break.

Field testids follow `field-<name>`, errors `field-error-<name>`. The wrapper div
also carries `data-testid` so the badge is reachable when the input itself can't
carry a pseudo-element.

## Order confirmation

Order number in mono, large. Status, items, totals, shipping address, payment
method summary. For pix, the static payload with a copy button. For boleto, the
due date from the injected clock.

`data-testid`: `order-confirmation`, `order-number`, `order-status`,
`order-total`, `pix-payload`, `pix-copy`, `boleto-due-date`.

## Component inventory

Each of these needs default, hover, focus-visible, loading, disabled, and error
states where applicable. Build them in milestone 2, before any page.

**Primitives** — `BaseButton` (action / outline / quiet / danger, three sizes,
loading with a spinner that preserves width), `BaseInput`, `BaseSelect`,
`BaseCheckbox`, `BaseRadioGroup`, `QuantityStepper`, `BaseDialog`, `BasePopover`,
`BaseToast` + `useToast`, `SkeletonBlock`, `Pagination`, `StarRating`,
`PriceDisplay`, `SpecStrip`, `BadgeChip`, `SellerTierMark`, `EmptyState`,
`ErrorState`.

**Composed** — `SiteHeader`, `CategoryMenu`, `CepSelector`, `ProductCard`,
`ProductGrid`, `FilterRail`, `FilterGroup`, `ActiveFilterChips`, `SortSelect`,
`ProductGallery`, `VariantSelector`, `ShippingEstimator`, `SellerPanel`,
`CartLine`, `CartSummary`, `CouponForm`, `CheckoutStepper`, `AddressForm`,
`PaymentMethodTabs`, `CardForm`, `OrderSummary`.

`PriceDisplay` and `SpecStrip` carry the design's personality. Get them right
first; everything else assembles around them.

---

## Clarifications resolved before milestone 3

Recorded here so the answers survive the session.

### Home section sources

Each home section is one catalog request, so the home page needs no endpoint of
its own:

- "Ofertas do dia" — `onSale=true`, `perPage=8`.
- "Recém-chegados" — `sort=newest`, `perPage=8`.
- "Patrocinados" — `sponsored=true`. The only place the `PATROCINADO` badge renders.
- Seller spotlight — a fixed seller, `s-01` (Casa do Som), set in app config. Fixed
  rather than rotating, so the home page is deterministic.

### `price` in the URL

`price=MIN-MAX` in integer centavos, or `MIN+` when there is no ceiling — the same
format as the `value` of each entry in `PRICE_BUCKETS`. A preset bucket and a
typed range that cover the same numbers produce the same URL. A typed range is
entered in reais and written to the URL in centavos.

### Header scope in milestone 3

`SiteHeader` (with `search-input` and `search-submit`) and `CategoryMenu` ship in
milestone 3. `CepSelector` and `cart-count` ship in milestone 5, together with the
cart they depend on.

### Unknown category

`/c/<unknown-slug>` renders the not-found page. `results-error` is reserved for
failures where retrying makes sense.

### The root route

`/` is the home page. The kitchen sink stays at `/kitchen-sink` only, still
dev-only.
