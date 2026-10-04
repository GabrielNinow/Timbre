# Timbre — project conventions

Timbre is a Brazilian marketplace for musical instruments and audio gear, new and
used, sold by both shops and individuals. It exists as a portfolio piece: the
storefront must be credible production-quality Vue, and it must be an excellent
target for end-to-end tests written in Cypress and Playwright.

Read `docs/` before implementing anything. Specs are authoritative; if this file
and a spec disagree, the spec wins and you should flag the conflict.

## Repository layout

```
timbre/
  app/          Vue 3 + Vite SPA
  api/          Fastify + TypeScript, in-memory store seeded from fixtures
  packages/
    contracts/  Zod schemas + inferred types, imported by app AND api
    fixtures/   Seed data (products, sellers, categories, users, coupons)
  e2e-cypress/  Separate package, own tsconfig
  e2e-playwright/
  docs/
```

`packages/contracts` is the single source of truth for request/response shapes
and form validation. Never duplicate a shape — import it.

## Stack (do not substitute)

- Vue 3.5+, `<script setup>`, TypeScript strict mode
- Vite, Vue Router, Pinia
- Tailwind CSS v4, configured with the tokens in `docs/design-system.md`
- Reka UI for dialog, popover, select, and combobox primitives
- vue-i18n, pt-BR only for now, but every user-facing string lives in
  `app/src/locales/pt-BR.json`. Zero hardcoded copy in components.
- Zod for validation, shared via `packages/contracts`
- Fastify for the API, no database — an in-memory store reset from fixtures
- Vitest for unit tests of pure logic only (pricing, filters, validators)

## Non-negotiable rules

1. **Every interactive element carries `data-testid`.** Naming is
   `entity-action`, kebab-case: `product-card`, `cart-line-remove`,
   `coupon-apply`, `filter-condition-option`. Never encode a dynamic id into the
   testid string. Scope with a second attribute instead:
   `data-testid="product-card" data-product-id="p-0142"`.

2. **No `Date.now()`, `new Date()`, or `Math.random()` in components, stores, or
   render paths.** Time comes from `useClock()` in `app/src/composables/clock.ts`,
   which reads a single injected source. IDs come from the API. This is what makes
   `cy.clock()` and `page.clock` usable.

3. **Never assert-proof the app by hiding state.** Loading, empty, error, and
   partial states must each render distinct, testable markup. A spinner that
   replaces the whole page is worse than a skeleton that keeps the layout.

4. **Server state lives in the API, not in the client.** Cart, coupons, auth, and
   orders are all server-side and survive reload. The client cache is Pinia; it is
   never the source of truth.

5. **Every list response is paginated and deterministically ordered.** Ties break
   on `id` ascending, always. Two identical requests return identical bytes.

6. **Accessibility is part of done.** Semantic landmarks, labelled form controls,
   visible focus rings, keyboard-operable dialogs and menus, `aria-live` on cart
   count and on error summaries. `prefers-reduced-motion` disables all transitions.

## Style rules

- Tailwind utilities in templates. No `@apply` except in `app/src/style.css` for
  the three base primitives (`.btn`, `.field`, `.card`) that would otherwise
  repeat twenty times.
- Design tokens are CSS custom properties defined in `@theme`. Never write a raw
  hex value in a component.
- Components are `PascalCase.vue`, composables are `useThing.ts`, stores are
  `useThingStore` in `app/src/stores/thing.ts`.
- Props typed with `defineProps<T>()`, no runtime prop objects. Emits typed with
  `defineEmits<T>()`.
- No component over ~200 lines. Split before that.

## Commits

Conventional commits, scoped by package: `feat(app):`, `fix(api):`,
`test(e2e-cypress):`, `docs:`. One milestone per branch.

## Working agreement

- Build one milestone at a time from `docs/milestones.md`. Stop at the end of each
  and report what was built against the acceptance criteria.
- If a spec is ambiguous, ask rather than inventing. Record the answer in the spec
  file so it survives the session.
- Do not write E2E tests unless the milestone asks for them. The test suites are
  authored deliberately, not generated wholesale.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on `GabrielNinow/Timbre`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels, unchanged: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
