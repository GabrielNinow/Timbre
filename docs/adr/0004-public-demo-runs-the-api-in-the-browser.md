# The public demo runs the API inside each Visitor's browser

The public demo is a static build on GitHub Pages. Inside it, the app calls the same API handlers the Fastify service uses, in-process, instead of over the network. The routes are extracted into framework-agnostic handlers, request in and response out, built on the existing store, pricing and catalog modules. Fastify and the in-browser transport are two thin adapters over them, so both run one implementation. Each Visitor therefore gets their own store: nothing they type leaves their browser, one Visitor can never deplete stock for another, and there is no server to attack or pay for. The store persists as a snapshot in the Visitor's `localStorage` with a "Reset demo" control. It uses the browser's real clock, and the test-control routes do not exist in it. The Fastify service stays the real backend for development, both E2E suites and CI.

## Considered Options

- **Host the Fastify API publicly** (Render, Fly.io, Railway) — rejected for now: it needs unguessable tokens, rate limiting, memory caps, a CORS allowlist and visitor isolation on a shared store. That turns a portfolio piece into a service to secure and pay for.
- **Mock Service Worker handlers written separately** — rejected: they would duplicate route rules (validation, errors, currency) and drift from the real API.
- **In-memory only, reset on every reload** — rejected: the cart would vanish on reload, contradicting rule 4's promise that the cart survives it.
