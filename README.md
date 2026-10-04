# Timbre

[![checks](https://github.com/GabrielNinow/Timbre/actions/workflows/checks.yml/badge.svg)](https://github.com/GabrielNinow/Timbre/actions/workflows/checks.yml)
[![cypress](https://github.com/GabrielNinow/Timbre/actions/workflows/cypress.yml/badge.svg)](https://github.com/GabrielNinow/Timbre/actions/workflows/cypress.yml)
[![playwright](https://github.com/GabrielNinow/Timbre/actions/workflows/playwright.yml/badge.svg)](https://github.com/GabrielNinow/Timbre/actions/workflows/playwright.yml)

A Brazilian marketplace for musical instruments and audio gear, built to be an
excellent target for end-to-end tests, and tested twice: once with Cypress, once
with Playwright, so the two can be compared on the same app.

**Test reports:** [Cypress](https://gabrielninow.github.io/Timbre/cypress/) ·
[Playwright](https://gabrielninow.github.io/Timbre/playwright/), published by CI
from the latest run on `main`.

Everything is fictional: products, sellers, accounts and payments. The Pix code
is a static string, and no data a Visitor types leaves the process memory
(`CONTEXT.md`).

## Architecture, and why the API is real

```
app/                 Vue 3 + Vite SPA (Pinia, Vue Router, vue-i18n, Reka UI, Tailwind v4)
api/                 Fastify + TypeScript, in-memory store seeded from fixtures
packages/contracts/  Zod schemas + types, imported by the app, the API and both suites
packages/fixtures/   Deterministic seed data: 60 products, 8 sellers, 5 users, coupons, CEPs
e2e-cypress/         Cypress suite (E2E + component)
e2e-playwright/      Playwright suite
docs/                Specs, ADRs
```

The API is a real HTTP service, not a mock. Cart, coupons, auth and orders live on
the server and survive a reload; the client caches, never decides. Real business
rules then run under every test: per-seller shipping, a coupon matrix with
minimums and expiry, stock that runs out, guest-cart merging, card outcomes. A
mocked backend would test the mocks.

It still has no database. A `POST /api/test/reset` restores the fixture state in
milliseconds, and test-control endpoints seed sessions, freeze the clock and arm
failures. `packages/contracts` is the single source of truth: the API validates
every response against it in test mode, and the app validates what it receives.

## Run it

```sh
npm install
npm run api:dev & npm run app:dev   # http://localhost:5173

npm test                            # unit + API tests (Vitest)
npm run cypress                     # build, serve, run the Cypress E2E suite
npm run cypress:component           # Cypress component tests
npm run playwright                  # build, run Playwright (chromium, firefox, webkit, mobile)
```

## Conventions that make it testable

- **Selectors.** Every interactive element and every asserted value carries a
  `data-testid` named `entity-action`. Ids never go into the testid: they go in a
  sibling attribute (`data-testid="product-card" data-product-id="p-0101"`), so
  `getByTestId('product-card')` stays a countable collection.
- **Codes, not copy.** Every API error carries a stable `code`, rendered as
  `data-error-code`. Tests assert on codes, never on translated text. That is what
  lets one test run unchanged in Portuguese and English.
- **State in the DOM.** Lists expose `data-state="loading|error|empty|ready"`.
  Buttons enter `disabled` and `data-loading="true"` synchronously on click.
  Suites wait on these, never on time.
- **Determinism.** No `Date.now()`, `new Date()` or `Math.random()` outside one
  injected clock (lint-enforced). Every list breaks ties on `id`, and two identical
  requests return identical bytes. Order numbers come from a sequence: the first
  order on a fresh store is always `TMB-100241`.
- **Setup by API.** Tests reset, seed sessions, carts and checkout drafts over the
  API and through three documented storage keys. Sign-in through the UI happens in
  exactly one spec per suite.
- **Accessibility as a test surface.** axe runs on every route, in both languages,
  in both suites: zero `wcag2a`/`wcag2aa` violations.

## Three error-injection layers, and when each is right

| Layer | Use it for | Example |
|---|---|---|
| `POST /api/test/failure` | A **real** failure response from the server, including how the app retries | arm `GET /api/products` → `results-error` with `INJECTED_FAILURE` → retry → results |
| `cy.intercept` / `page.route` | What the server **cannot** produce | malformed JSON, a request that never answers, an empty result for a query that would match |
| Fixture trigger values | The **whole stack** running for real | card `4000…0002` declines, CEP `69900-000` has no express, `bloqueado@timbre.test` is locked |

Arming is the honest default: the app meets a real envelope from a real server.
Stubbing is for states the contract allows but the fixtures never reach. Trigger
values are for journeys, where you want every layer to actually run.

## Two languages, two currencies

Pages exist in Portuguese (`/`) and English (`/en/...`). The address alone
decides the language, never the browser, so every test runner renders the same
page (ADR 0001). The Currency follows the language: reais under Portuguese,
dollars under English, at a fixed Demo exchange rate of R$ 5,00 = US$ 1.
Free-shipping and coupon rules are always decided in reais. Otherwise a R$ 299,99
cart, which is exactly US$ 60.00 once rounded, would ship free in one language and
not the other (ADR 0002). Both suites check that every page has the same structure
in both languages.

## Cypress vs Playwright

Both suites cover the same core journeys against the same build: catalog, product
and variants, cart, the full coupon matrix (generated from fixtures), the
three-step checkout, every declining card plus a retry, guards and redirects, both
languages, both currencies, and axe on every route.

### Measured in CI

Wall-clock times from GitHub Actions (ubuntu-latest), from the run linked under
each workflow badge.

<!-- ci-times:start -->
| Suite | Tests | Parallelism | Slowest job | Workflow total |
|---|---|---|---|---|
| Cypress E2E | 114 | 2 containers | _pending first CI run_ | _pending_ |
| Cypress component | 14 | 1 container | _pending_ | — |
| Playwright | 201 per browser set | 3 browsers × 3 shards × 3 workers | _pending_ | _pending_ |
<!-- ci-times:end -->

Locally, on one machine: Cypress runs its 114 E2E tests serially in about
**1:05**. Playwright runs 201 tests (chromium, firefox and mobile) across 3
workers in about **1:30**. Both suites passed ten consecutive runs with
`retries: 0`.

### Where each one is genuinely better

**Playwright**
- **Several Visitors at once.** `race.spec.ts` opens two browser contexts, two
  Demo accounts, and buys the last unit of `p-0101` at the same instant. Exactly
  one order goes through. Cypress runs one browser tab per test and cannot express
  this.
- **True parallelism.** Workers and shards out of the box. Here each worker even
  runs its own API process, reached by request routing (ADR 0003). Free Cypress
  parallelism means splitting specs across CI containers by hand.
- **Cross-browser.** Chromium, Firefox and WebKit from one config. Cypress has no
  WebKit beyond an experimental flag.
- **Device emulation and traces.** A Pixel 7 descriptor drives the mobile filter
  dialog. A trace of a deliberately failing test shows every step, the DOM and the
  network call that failed.
- **It caught a bug Cypress missed.** Clicking "Sign in" sometimes did nothing.
  The blur on `mousedown` cleared the last validation error, the error summary
  collapsed, and the button moved out from under the pointer before `mouseup`.
  Cypress's `.type()` blurs fields earlier, so it never hit the window.

**Cypress**
- **Component testing.** `PriceDisplay`, `FilterRail` and `QuantityStepper` mount
  in isolation, with the app's i18n, Pinia and router, using the same commands and
  runner as E2E.
- **The interactive runner.** Time-travel snapshots of every command make
  writing and debugging a checkout flow fast.
- **Less ceremony.** Retry-ability is implicit in every query. Isolation is
  simpler too, because specs run serially against one API.

## Documentation

- `CONTEXT.md`: the domain glossary (Visitor, Demo account, Listing content, Platform copy, Currency).
- `docs/milestones.md`: how the project was built, milestone by milestone, with acceptance criteria.
- `docs/api-contract.md`, `docs/pages-and-components.md`, `docs/testability.md`, `docs/design-system.md`, `docs/seed-data.md`: the specs.
- `docs/adr/`: English technical surface and bilingual pages (0001), multi-currency (0002), one API per Playwright worker (0003).
- `e2e-cypress/README.md`, `e2e-playwright/README.md`: how each suite is built.
