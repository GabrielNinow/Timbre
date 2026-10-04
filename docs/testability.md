# Testability contract

This is the part of the spec that makes the project worth building. Treat every
item here as a functional requirement, not a nice-to-have.

## Selector policy

`data-testid` on every interactive element and every element carrying a value a
test will assert. Naming is `entity-action` or `entity-property`, kebab-case.

**Never encode a dynamic id into the testid.** Scope with a sibling attribute:

```html
<!-- wrong -->
<article data-testid="product-card-p-0101">

<!-- right -->
<article data-testid="product-card" data-product-id="p-0101">
```

This keeps `getByTestId('product-card')` meaningful as a collection, which is what
you need for counting results, and still allows precise targeting.

**Expose stable codes as attributes.** Anywhere the API returns an error `code`,
render it as `data-error-code` alongside the localized message. Tests assert on
the code; the pt-BR copy is free to change without breaking anything. This is the
single most useful convention in the file — it is what makes an i18n app testable.

Do the same for state that is otherwise only visible through styling:
`data-state="loading|error|empty|ready"` on list containers,
`data-selected="true"` on active filter options, `data-stock-state` on cards.

## Determinism

- No `Date.now()`, `new Date()`, or `Math.random()` outside `useClock()` and the
  API's id generator. A lint rule should enforce this — add
  `no-restricted-globals` / `no-restricted-syntax` entries for them.
- Every list is ordered deterministically with `id` as the final tiebreaker.
- Order numbers, cart ids, and session tokens come from the fixture sequence, not
  from randomness.
- Relative times ("anunciado há 3 dias") derive from the injected clock so
  `cy.clock()` and `page.clock.setFixedTime()` control them.
- No animation is required for a state to become assertable. A test must never
  need to wait for a transition to finish before an element is queryable.

## Setup and teardown

Both suites do this in `beforeEach`:

1. `POST /api/test/reset`
2. `POST /api/test/session` with the fixture email, when the test needs auth,
   then write the token where the app reads it: `localStorage['timbre.session']`.
   A guest cart's id lives in `localStorage['timbre.cart']`. These two keys are
   the only client-side state; both point at server state (rule 4).
3. Optionally `POST /api/test/clock` to freeze time
4. Navigate directly to the deepest relevant URL

**Log in through the UI exactly once**, in the auth spec. Every other test seeds
the session over the API. Same for cart contents: `POST /api/cart/items` directly
rather than clicking through the catalog. This is the difference between a suite
that runs in 90 seconds and one that runs in 12 minutes.

## Waiting

The app must never require a fixed sleep to be testable. Concretely:

- Loading skeletons are present in the DOM with `data-state="loading"` and are
  removed — not hidden — when content arrives.
- Toasts have a data attribute for their state and do not auto-dismiss in under
  4 seconds.
- Buttons that trigger a request enter a `disabled` + `data-loading="true"` state
  synchronously on click, so tests can wait on the transition rather than on a
  network idle heuristic.
- Anything that reads "the operation finished" is expressed in the DOM, not only
  in a console log or a network response.

## Error injection

Three layers, and the project should demonstrate all three because they suit
different jobs:

1. **`POST /api/test/failure`** — server-side arming. Best for testing that the
   *app* handles a real failure response correctly, including retry behaviour.
2. **`cy.intercept` / `page.route`** — client-side stubbing. Best for scenarios
   the server can't easily produce: malformed JSON, a hung request, a 30-second
   response, an empty results array for a query that would otherwise match.
3. **Fixture accounts and trigger values** — the card numbers and CEPs in
   `api-contract.md`. Best for realistic end-to-end paths where you want the whole
   stack to actually run.

Write the README section comparing them. That comparison is more interesting to a
reviewer than the tests themselves.

## Accessibility as a test surface

Run `axe-core` on every route in both suites — `cypress-axe` and
`@axe-core/playwright`. The app must pass with zero violations at the `wcag2a` and
`wcag2aa` tags. This is cheap to keep green if it starts green, and very expensive
to retrofit, which is why it belongs in the spec rather than in a later milestone.

Specific obligations: every input has a programmatically associated label, dialogs
trap focus and restore it on close, the error summary is `role="alert"`, cart count
is `aria-live="polite"`, and skip-to-content exists.

## What the two suites should cover differently

They should not be identical. The comparison is the point.

**Both** cover the core journeys: search and filter, product page and variants,
cart mutation, coupon matrix, the three-step checkout, payment failure and retry,
auth guards and redirect.

**Playwright additionally** covers things Cypress handles awkwardly, and the
README should say so plainly: multiple browser contexts (two users, stock
depleting under one of them), true parallel sharding, cross-origin, downloads,
mobile emulation via device descriptors, and trace-viewer debugging.

**Cypress additionally** covers what it is genuinely better at: component testing
of `PriceDisplay`, `FilterRail`, and `QuantityStepper` in isolation, and its
time-travel debugger for the checkout flow.

## CI

GitHub Actions, two workflows, both running against a built app and the API in
test mode. Matrix Playwright across chromium/firefox/webkit; run Cypress in at
least two parallel containers. Publish both HTML reports to GitHub Pages and link
them from the README.

Quarantine nothing. If a test is flaky, fix the app or fix the test — a suite with
a `retries: 2` band-aid is the exact opposite of what this portfolio is arguing.
