# Timbre — Playwright suite

End-to-end tests for the Timbre storefront, run against the production build. It
covers everything the Cypress suite covers, plus what Playwright does better:
several browser contexts at once, true parallel sharding, device emulation, a
cross-browser matrix, and trace-viewer debugging.

```sh
npm run playwright                                   # build, then chromium + firefox + webkit + mobile
npm run pw:test -w @timbre/e2e-playwright -- --shard=1/3   # one shard of three
npm run pw:trace-demo -w @timbre/e2e-playwright      # the deliberately failing trace example
npm run pw:report -w @timbre/e2e-playwright          # open the HTML report
```

## Isolation: one API per worker

`support/fixtures.ts` starts **one API process per worker** in test mode, on port
`3400 + worker index`. Every browser context routes `/api/*` to its worker's API
(ADR 0003, `docs/testability.md`). The preview server and the build are shared;
the in-memory store never is. That is what lets three workers, and any number of
shards, run with zero retries.

## Fixtures

| Fixture | What it does |
|---|---|
| `resetStore` (auto) | `POST /api/test/reset` on the worker's API before every test |
| `test.use({ account: 'ana' })` | signs in by **`storageState`**, built from `POST /api/test/session` (`localStorage['timbre.session']`) |
| `seed.cart(items)` | cart lines over the API: on the account, or a guest cart remembered for the page |
| `seed.checkout(draft)` | `sessionStorage['timbre.checkout']`, so a test can start at payment or review |
| `seed.clock(iso)` | the API clock and `page.clock.setFixedTime` together |
| `seed.failure(route)` | `POST /api/test/failure`: the next call really fails |
| `newVisitor(account)` | a second, isolated browser context, already routed and signed in |

The UI sign-in form is used in exactly one test, in `auth.spec.ts`.

## Projects

| Project | Runs |
|---|---|
| `chromium`, `firefox`, `webkit` | every spec except `@mobile` and `@trace-demo` |
| `mobile` | `@mobile`: the filter rail as a full-screen dialog under a Pixel 7 device descriptor, driven by keyboard |
| `trace-demo` | `@trace-demo` only, `trace: 'on'`: fails on purpose, excluded from normal runs |

## Playwright-only scenarios

- **`race.spec.ts`**: two Demo accounts in two browser contexts buy the last unit
  of `p-0101` at the same instant. Exactly one order goes through; the other gets
  `STOCK_CHANGED`, and stock ends at 0.
- **`mobile.spec.ts`**: the responsive rail on emulated hardware: focus trap,
  Space to filter, Escape restores focus, no horizontal scroll.
- **`trace-demo.spec.ts`**: arms a real failure, then expects the wrong thing.
  `npx playwright show-trace test-results/…/trace.zip` shows each step, the DOM,
  and the network call that failed.

## Notes

- The coupon matrix and the card declines are generated from `@timbre/fixtures`
  and `CARD_OUTCOMES`, as in the Cypress suite.
- Stubs fetch the real response from the worker's API (`route.fetch({ url })`),
  never from the preview proxy, which has no API behind it.
- **WebKit** needs `libmanette-0.2-0` and `libenchant-2-2` on Linux:
  `sudo npx playwright install-deps webkit`. CI installs them with
  `npx playwright install --with-deps`.
