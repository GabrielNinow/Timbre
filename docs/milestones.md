# Milestones

Build one at a time. Stop at the end of each, report against the acceptance
criteria, and wait. Do not start the next milestone in the same session unless
told to.

Each milestone is a branch and a PR. Nothing merges without its acceptance
criteria demonstrably met.

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

## Deliberately out of scope

Do not build these without being asked: seller onboarding, admin panels, real
payment integration, reviews and ratings submission, wishlists, chat, address
book CRUD beyond what checkout needs, SSR, PWA, dark mode.
