# Timbre — Cypress suite

End-to-end and component tests for the Timbre storefront. They run against the
production build with the API in test mode, exactly as CI will.

```sh
npm run cypress            # build the app, serve it with the API in test mode, run every E2E spec
npm run cypress:component  # PriceDisplay, FilterRail, QuantityStepper in isolation
npm run cy:open -w @timbre/e2e-cypress   # interactive runner (serve first: npm run e2e:serve)
```

## Structure: task-based actions

Specs read as journeys: what a Visitor does, in the domain's words (`CONTEXT.md`).
The actions in `cypress/actions/` hold every selector and every multi-step
interaction (`applyCoupon`, `payByCard`, `switchLanguage`), so specs never touch
a selector directly.

I chose actions over page objects because Timbre's journeys cross pages
constantly: the header cart, the language switcher, a guard that redirects to
sign-in. A function per action composes across those boundaries. A class per page
would either duplicate them or grow a shared base class that knows every page.

## Setup is API-seeded, never clicked

`cypress/support/commands.ts` implements `docs/testability.md`:

| Command | What it does |
|---|---|
| `resetStore` | `POST /api/test/reset`, before every test (`support/e2e.ts`) |
| `seedSession(email)` | `POST /api/test/session`; the token is written to `localStorage['timbre.session']` before the app boots |
| `seedCart(items)` | adds lines over the API; a guest cart's id goes to `localStorage['timbre.cart']` |
| `seedCheckout(draft)` | writes `sessionStorage['timbre.checkout']`, so a test can start at payment or review |
| `freezeClock(iso)` | freezes both clocks: `POST /api/test/clock` for the API, `cy.clock` for the browser |
| `armFailure(route)` | `POST /api/test/failure`: the next call to that route fails for real |
| `open(path)` | `cy.visit` that applies the seeded storage in `onBeforeLoad` |

The UI sign-in form is used in exactly one spec, `auth.cy.ts`. Every other test
seeds the session.

## What each spec proves

| Spec | Covers |
|---|---|
| `catalog.cy.ts` | URL reconstruction, filters, chips, facet counts, typed price validation, header search, the category page, the sponsored row, and the three error-injection layers |
| `product.cy.ts` | `p-0103` variants and `?option=`, the sold-out option, the `p-0101` stock cap, `p-0102` notify-me, CEP behaviours, `p-0602` zero reviews, the seller page |
| `cart.cy.ts` | increment vs duplicate, server-side quantity, seller groups, `INSUFFICIENT_STOCK` when stock changes under an open page, shipping thresholds, `FRETEGRATIS`, the empty state, the CEP selector, a dropped coupon |
| `coupons.cy.ts` | the full coupon matrix, **generated from the fixtures**: each coupon on carts either side of its rules |
| `auth.cy.ts` | the guard redirect round trip through the form, the guest cart merge, all four Demo accounts, `EMAIL_TAKEN`, sign-out |
| `checkout.cy.ts` | blur and submit validation with focus, CEP lookup, card end to end with stock decrement, **every declining card** (generated from `CARD_OUTCOMES`) then a retry, terms, Pix, the boleto under `cy.clock`, guards |
| `languages.cy.ts` | identical structure under `/x` and `/en/x`, the switcher, dollar prices at the Demo exchange rate, the price filter converting on switch, cart sums in both currencies, card-only `/en` checkout, a BRL order staying BRL |
| `a11y.cy.ts` | `cypress-axe` on every route in both languages, seeded where a route needs state: zero `wcag2a`/`wcag2aa` violations |

## Error injection: which layer, when

- **`armFailure`**: the server really fails. Use it to test how the app handles
  a real error response and its retry.
- **`cy.intercept`**: for what the server cannot produce: malformed JSON, a hung
  request, an empty result for a query that would match. The empty set is a real
  response with its items removed, so it still satisfies the contract.
- **Fixture trigger values**: card numbers, CEPs and Demo accounts that run the
  whole stack for real.

## Known limit

The R$ 299,99 rounding trap from ADR 0002 needs a cart subtotal of exactly R$
299,99. Fixture prices always sum to a multiple of ten centavos, so no cart can
reach it. The trap is asserted at the HTTP seam (`api/test/currency.test.ts`).
This suite asserts the boundary from the nearest reachable cart, R$ 299,40, in
both currencies.

## Rules

- `retries: 0`. A flaky test means the app or the test gets fixed.
- No fixed waits. Every wait targets a DOM state: `data-state`, `data-loading`,
  or a testid appearing.
- Assert on `data-testid`, `data-error-code` and `data-*` state, never on
  translated copy. The one exception is checking that a page speaks its language.
