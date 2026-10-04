# Milestones

Build one at a time. Stop at the end of each, report against the acceptance
criteria, and wait. Do not start the next milestone in the same session unless
told to.

Each milestone is a branch and a PR. Nothing merges without its acceptance
criteria demonstrably met. Milestones 1 and 2 predate this rule and were committed
straight to `main`; their history stays as is. From milestone 3 on, the rule applies
without exception.

---

## 1 — Contracts, fixtures, and API

`packages/contracts`, `packages/fixtures`, `api/`.

Everything in `api-contract.md` and `seed-data.md`, implemented in full. All 60
products, 8 sellers, 4 users, the coupon matrix, the CEP table, the card-number
outcomes, and the four test-control endpoints.

**Acceptance**
- Zod schemas exported from `packages/contracts`; the API validates every request
  body and every response against them in test mode.
- `POST /api/test/reset` restores fixture state in under 50ms.
- Every error code listed in `api-contract.md` is reachable, and there is a Vitest
  test proving it.
- Facet counts are computed against other active filters, verified by a test with
  two filters applied.
- A fresh store's first order is `TMB-100241`.
- No floats anywhere on the wire.

Do not write any Vue code in this milestone.

---

## 2 — Design system and primitives

`app/` scaffolding, Tailwind v4 `@theme` with the exact tokens from
`design-system.md`, fonts self-hosted, i18n wired with `pt-BR.json`, and every
component in the "Primitives" list.

**Acceptance**
- A `/kitchen-sink` dev-only route renders every primitive in every state:
  default, hover, focus-visible, loading, disabled, error.
- `PriceDisplay` renders R$ 39,90 through R$ 8.990,00 without width shift, with
  and without a struck list price and discount percentage.
- `SpecStrip` and `SellerTierMark` match the spec exactly.
- `BaseDialog` traps focus, restores it on close, and closes on Escape.
- Zero raw hex values outside `style.css`. Zero hardcoded user-facing strings
  outside `pt-BR.json`.
- `prefers-reduced-motion: reduce` disables every transition.
- axe passes on the kitchen sink.

---

## 3 — Catalog: home, search, filters

Router, Pinia stores, API client, `ProductCard`, `ProductGrid`, `FilterRail`,
`ActiveFilterChips`, `SortSelect`, `Pagination`, home page, search and category
pages.

**Acceptance**
- A listing page is fully reconstructible from its URL. Reloading a filtered,
  sorted, paginated view produces identical output.
- All four list states render with their distinct testids and `data-state` values.
- Filter changes update the URL, the chips, and the facet counts.
- The rail collapses to a full-screen dialog below 768px and remains keyboard
  operable.
- The sponsored row is labelled and visually distinct from organic results.
- Grid reflows at all four breakpoints without card height inconsistency.
- axe passes on `/`, `/busca`, `/c/guitarras`.

---

## 3.1 — English contracts and routes

Rename every technical surface to English. No behaviour changes: the existing
tests, updated, are the proof. See ADR 0001. Update the specs first — they are
authoritative — then contracts, fixtures, API, app, and the Bruno collection.

| Surface | Before | After |
|---|---|---|
| Condition | `novo` `seminovo` `usado` | `new` `like-new` `used` |
| Seller tier | `PRATA` `OURO` `PLATINA` | `SILVER` `GOLD` `PLATINUM` |
| Sort | `relevancia` `menor-preco` `maior-preco` `mais-recentes` | `relevance` `price-asc` `price-desc` `newest` |
| Shipping method | `padrao` `expressa` | `standard` `express` |
| Payment method | `cartao` `pix` `boleto` | `card` `pix` `boleto` |
| Unknown card brand | `desconhecida` | `unknown` |
| Order status | `aguardando_pagamento` `pago` `enviado` `entregue` `cancelado` | `awaiting_payment` `paid` `shipped` `delivered` `cancelled` |
| Category slugs | `guitarras` `teclados` `bateria` `estudio` `pedais` `acessorios` | `guitars` `keyboards` `drums` `studio` `pedals` `accessories` |
| Routes | `/busca` `/v/:seller` `/carrinho` `/checkout/entrega\|pagamento\|revisao` `/pedido/:id` `/entrar` `/criar-conta` `/minha-conta/pedidos` | `/search` `/s/:seller` `/cart` `/checkout/shipping\|payment\|review` `/orders/:id` `/sign-in` `/sign-up` `/account/orders` (`/c/:slug` and `/p/:slug--:id` unchanged) |
| Listing query | `categoria` `marca` `condicao` `preco` `frete` `ordem` `pagina` | `category` `brand` `condition` `price` `freeShipping` `sort` `page` (`q` unchanged; `price` stays one `MIN-MAX` param) |
| API error messages | pt-BR | English; the app shows Platform copy keyed by `code` |

Unchanged on purpose: `pix`, `boleto`, CEP, UF (Brazilian domain names), product
and seller slugs (Listing content), coupon codes (campaign content).

**Acceptance**
- Every value in the table is renamed across specs, contracts, fixtures, API,
  app, tests, and the Bruno collection. No Portuguese remains on the wire or in a
  URL, except the unchanged values above and Listing content.
- Every existing test passes after being updated, with no behaviour change.
- Acceptance criteria in later milestones are rewritten to the new names.

---

## 3.2 — Bilingual UI

Two Page languages: Portuguese (default, unprefixed) and English under `/en`.
See ADR 0001.

- The router accepts an optional `/en` prefix on every route; every internal
  link preserves the current Page language. No browser-language detection.
- `app/src/locales/en.json` alongside `pt-BR.json`, with identical keys.
- A language switcher in the header keeps the current path and query.
- `<html lang>` follows the Page language.
- Platform copy moves to the client, keyed by stable codes: category names
  (by slug) and price-bucket labels join conditions and tiers. The API stops
  sending display labels.
- Listing content (product names, descriptions, specs, store bios) is shown as
  written, in both languages.
- Numbers and dates format by Page language.

**Acceptance**
- The same page renders under `/x` and `/en/x` with identical `data-testid`
  structure and data attributes; only copy and formatting differ.
- Switching language keeps the path, query, and scroll target.
- `en.json` and `pt-BR.json` have exactly the same keys, enforced by a unit test.
- axe passes on `/`, `/search`, `/c/guitars` in both languages.
- Kitchen sink renders every primitive in both languages.

---

## 3.3 — Multi-currency

Currency follows Page language: BRL for Portuguese, USD for English. See ADR 0002.

- Every money-bearing endpoint takes the Currency as a `currency=BRL|USD` query
  parameter (catalog, seller, cart and its mutations, shipping quote, order
  creation). Omitted means `BRL`, so existing callers keep working. Responses
  carry `currency` beside amounts.
- The Demo exchange rate is a fixture constant, R$ 5,00 = US$ 1, exposed by the
  API.
- Conversion: each unit price converts once, rounded half-up to the cent; every
  sum (line totals, subtotal, shipping, discount, total) is computed from
  converted values, so totals always add up.
- **Eligibility is always decided in BRL**: free-shipping threshold, coupon
  minimums and applicability. Only resulting amounts convert.
- USD accepts only `card`. `pix` or `boleto` with USD returns 422
  `PAYMENT_METHOD_UNAVAILABLE`.
- Orders store their `currency` and charged amounts and are never reconverted;
  fixture orders are BRL. An order renders in its own Currency, formatted by Page
  language.
- The app's catalog shows USD under `/en`. Cart and checkout UI land in
  milestones 5 and 6, carrying the currency criteria listed there.

**Acceptance**
- The same product carries the same BRL-based identity in both currencies, and
  its USD price equals its BRL price divided by the Demo exchange rate, rounded
  half-up — asserted for all 60 products and every variant option.
- A cart with subtotal R$ 299,99 gets no free shipping in either currency.
- Every coupon in the matrix produces the same outcome in both currencies.
- Line totals, subtotal, discount, shipping, and total add up exactly in USD.
- `PAYMENT_METHOD_UNAVAILABLE` is reachable and covered by a test.
- `TMB-100236` renders in BRL under `/en`.
- Facet price buckets and the `price` filter work in the request's Currency.

---

## 4 — Product page and seller page

Gallery, variant selector, quantity stepper, shipping estimator, seller panel,
related products, seller page with its own filters.

**Acceptance**
- `p-0103` variant switching updates price, stock, and the `?opcao=` query; the
  sold-out Black option is selectable but blocks adding to cart with a clear reason.
- `p-0102` renders the out-of-stock treatment with the "Avise-me" form.
- `p-0101` caps the stepper at 1 and disables increment with a visible notice.
- CEP `69900-000` returns a shipping list without the express option.
- CEP `00000-000` renders a field error, `99999-999` renders a retryable form error.
- `p-0602` renders the zero-review state.
- `s-08` renders a seller page with no pagination.

---

## 5 — Cart and coupons

Cart page, per-seller line grouping, quantity mutation, coupon form, shipping
method selection, summary. Cart persists across reload and merges on login.

**Acceptance**
- Every coupon in the matrix produces its documented outcome, with
  `data-error-code` on the failure cases.
- Adding a product already in the cart increments rather than duplicating.
- Quantity beyond stock surfaces `INSUFFICIENT_STOCK` with the available count.
- Free standard shipping applies at subtotal ≥ R$ 300,00 and `FRETEGRATIS` zeroes
  any method.
- Empty cart renders its own state.
- A guest cart survives reload and merges into the user cart on login.
- The same cart under `/en/cart` shows USD amounts that add up exactly, with the
  same free-shipping and coupon outcomes as under `/cart`.

---

## 6 — Auth and checkout

Login, register, route guards with redirect round-trip, the three checkout steps,
order creation, confirmation, order history.

**Acceptance**
- Visiting `/checkout/entrega` unauthenticated redirects to
  `/entrar?redirect=...` and returns after login.
- All four fixture accounts behave as documented, including the locked account
  and the slow login.
- Validation runs on blur and on submit; submit failure moves focus to the first
  invalid field and renders the `role="alert"` summary.
- Each declining card number produces its documented error at the review step
  **without clearing the cart**, and a retry with a good card succeeds.
- Pix and boleto produce their respective confirmation renders; the boleto due
  date derives from the injected clock.
- `TMB-100238` returns 403 for a logged-in user who does not own it, and the app
  renders a proper forbidden state rather than a crash.
- Stock decrements after a successful order.
- Under `/en`, checkout offers card only. Choosing pix, then switching to
  `/en/checkout/review`, returns the Visitor to `/en/checkout/payment` with
  `data-error-code="PAYMENT_METHOD_UNAVAILABLE"` and the cart intact.

---

## 7 — Cypress suite

`e2e-cypress/`, TypeScript, page-object or task-based structure — pick one and
apply it consistently. API-seeded setup per `testability.md`. Component tests for
`PriceDisplay`, `FilterRail`, `QuantityStepper`.

**Acceptance**
- `beforeEach` resets via API; UI login appears in exactly one spec.
- Coverage of every core journey listed in `testability.md`.
- `cy.intercept` demonstrated for malformed JSON, a hung request, and an empty
  result set.
- `cy.clock` demonstrated on the boleto due date.
- `cypress-axe` on every route, zero violations.
- Full run under 3 minutes locally. Zero retries configured. Ten consecutive runs
  green.

---

## 8 — Playwright suite

`e2e-playwright/`, TypeScript, fixtures-based setup, `storageState` for auth.

**Acceptance**
- Everything Cypress covers, plus: two browser contexts racing the last unit of
  `p-0101`, device-descriptor mobile run of the filter dialog, and a trace
  attached to a deliberately failing example.
- Matrix across chromium, firefox, webkit.
- Sharded across at least 3 workers.
- `@axe-core/playwright` on every route.
- Zero retries. Ten consecutive runs green.

---

## 9 — CI and README

Two GitHub Actions workflows, HTML reports published to Pages, and the README
that makes the case.

**Acceptance**
- Both workflows run against a production build with the API in test mode.
- Reports published and linked.
- README covers: the architecture and why the API is real, the selector and
  determinism conventions, the three error-injection layers and when each is
  right, and an honest Cypress-versus-Playwright comparison with measured run
  times from CI rather than opinions.
- Badges reflect real runs.

---

## 10 — Public demo (deferred, not yet specified)

Do not start until milestone 9 is merged. Until then nothing is deployed; the
portfolio's public surface is the repository, the README, and the CI reports on
GitHub Pages.

Already decided:
- Everything is fictional: products, sellers, accounts, payments. No real
  personal data is collected, so there is no real account registration.
- Login stays, using Demo accounts with publicly shown credentials and one-click
  sign-in. The login form remains, because the E2E suites drive it.
- Outside test mode, session tokens must be unguessable; inside test mode they
  stay deterministic as `testability.md` requires.

Open, to be grilled before this milestone is specified:
- Visitor isolation, so one Visitor depleting stock or arming state does not
  affect another (per-visitor sandbox vs. periodic reset).
- API abuse protection: rate limiting, body size limits, memory caps on the
  in-memory store, a CORS allowlist instead of `origin: true`.
- Whether test-control routes ever exist in the public deployment.
- Hosting: cheapest option that runs a long-lived Node process plus a static SPA.

---

## Deliberately out of scope

The product is web plus API only.

Do not build these without being asked: seller onboarding, admin panels, real
payment integration, reviews and ratings submission, wishlists, chat, address
book CRUD beyond what checkout needs, SSR, PWA, dark mode, native mobile apps
(and therefore mobile test tooling such as Appium, Maestro or Detox).
