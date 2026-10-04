# One API process per Playwright worker, reached by request routing

The API keeps all state in one in-memory store, and every test resets it. Parallel Playwright workers sharing that store would reset each other mid-test. So each worker starts its own API process on its own port. Every browser context then routes `/api/*` to its worker's API with `context.route`, while the production build and its preview server stay shared. The app needs no per-worker configuration, tests keep full parallelism and sharding, and stubs added inside a test still take precedence over the routing.

## Considered Options

- **Serial execution for reset-dependent specs** — rejected: nearly every spec resets, so it would leave little to parallelize.
- **One preview server per worker**, each proxying to its own API — rejected: it needs a build-time proxy target per worker and doubles the processes, for the same isolation.
- **Per-test namespaces inside one store** — rejected: it changes the API and the contract for a test-only concern.
