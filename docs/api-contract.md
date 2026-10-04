# API contract

Base path `/api`. JSON only. Fastify + TypeScript, in-memory store seeded from
`packages/fixtures`. No database.

Every shape below is defined as a Zod schema in `packages/contracts` and imported
by both sides. Build this milestone first — everything else depends on it.

## Conventions

- Money is **integer centavos** everywhere on the wire. `129990` is R$ 1.299,90.
  Never send floats. Formatting happens once, in the client.
- Timestamps are ISO 8601 UTC strings.
- Auth is `Authorization: Bearer <token>`. Tokens are opaque strings from the
  fixture set — not real JWTs, but they must be validated and rejected when unknown.
- The cart is server-side, keyed by `X-Cart-Id` for guests and by user for
  authenticated requests. On login, a guest cart merges into the user cart.
- Every list endpoint returns `{ items, page, perPage, total, facets? }` and
  orders results deterministically, breaking ties on `id` ascending.

## Error envelope

Uniform across every non-2xx response:

```jsonc
{
  "error": {
    "code": "COUPON_MIN_NOT_MET",     // stable, screaming snake, never localized
    "message": "Este cupom vale a partir de R$ 500,00.",
    "fields": { "cep": "CEP não encontrado." }  // optional, for 422 only
  }
}
```

Tests assert on `code`, never on `message`. Message text is pt-BR and may change.

Status codes: 400 malformed, 401 missing/bad token, 403 wrong owner, 404 unknown
id, 409 state conflict (stock ran out, coupon already applied), 422 validation
failure with `fields`, 500 simulated failure.

## Catalog

### `GET /api/categories`
Flat list of six categories with `{ id, slug, productCount }`. Category names
are Platform copy: the client renders them from `slug` in the Page language.

### `GET /api/products`

Query parameters, all optional:

| Param | Type | Notes |
|---|---|---|
| `q` | string | matches name, brand, seller name; accent-insensitive |
| `category` | slug | |
| `brand` | repeatable | |
| `condition` | repeatable | `new` \| `like-new` \| `used` |
| `sellerId` | string | |
| `minPrice` `maxPrice` | int centavos | |
| `freeShipping` | `true` | |
| `sponsored` | `true` | only `sponsored: true` listings; feeds the home "Patrocinados" row |
| `onSale` | `true` | only listings with `listPrice > price`; feeds "Ofertas do dia" |
| `sort` | enum | `relevance` (default) \| `price-asc` \| `price-desc` \| `newest` |
| `page` | int, default 1 | |
| `perPage` | int, default 24, max 60 | |

Returns items plus a `facets` object giving available values with counts for
brand, condition, and price buckets, computed against the *other* active filters
— so unselecting a brand doesn't hide its own count. This is the behaviour the
filter rail tests will exercise.

`ProductSummary`: `id`, `slug`, `name`, `brand`, `categoryId`, `price`,
`listPrice?`, `condition`, `year?`, `stock`, `freeShipping`, `imageUrl`,
`rating`, `reviewCount`, `seller` (id, name, slug, tier, state).

### `GET /api/products/:id`

`ProductDetail` extends the summary with `description`, `images[]`, `specs`
(ordered label/value pairs), and `variants?`.

A variant group is `{ label, options: [{ id, name, priceDelta, stock }] }`.
Products with variants have no top-level stock; stock is per option.

### `GET /api/sellers/:slug`
`{ seller, stats: { rating, salesCount, onTimeRate, memberSince }, products }`,
products paginated with the same shape as the catalog list.

## Auth

### `POST /api/auth/login` — `{ email, password }`

| Fixture account | Result |
|---|---|
| `ana.souza@timbre.test` / `Teste@1234` | 200, tier-less buyer |
| `bruno.lima@timbre.test` / `Teste@1234` | 200, has 3 past orders |
| `bloqueado@timbre.test` / `Teste@1234` | 403 `ACCOUNT_LOCKED` |
| any valid email, wrong password | 401 `INVALID_CREDENTIALS` |
| unknown email | 401 `INVALID_CREDENTIALS` — identical body, no user enumeration |
| `lento@timbre.test` / `Teste@1234` | 200 after a forced 3s delay |

Returns `{ token, user }`. `user` is `{ id, name, email, createdAt }`.

### `POST /api/auth/register`
422 `EMAIL_TAKEN` on an existing address. Password rules live in the shared Zod
schema so the client and server reject identically.

### `GET /api/auth/me` — 401 when the token is absent or unknown.

## Cart

- `GET /api/cart`
- `POST /api/cart/items` — `{ productId, variantOptionId?, quantity }`.
  409 `INSUFFICIENT_STOCK` with `available` in the body when quantity exceeds stock.
  Adding an existing line increments rather than duplicating.
- `PATCH /api/cart/items/:lineId` — `{ quantity }`. Quantity 0 removes the line.
- `DELETE /api/cart/items/:lineId`
- `POST /api/cart/coupon` — `{ code }`
- `DELETE /api/cart/coupon`

The cart response always carries a fully computed `totals` object so the client
never recalculates money:

```jsonc
{
  "id": "cart_...",
  "lines": [ /* line id, product summary, variant, unitPrice, quantity, lineTotal */ ],
  "coupon": { "code": "PRIMEIRACOMPRA", "discount": 5000 },
  "shippingOptions": [ /* id, price, etaDays */ ],
  "selectedShippingId": "standard",
  "totals": {
    "subtotal": 129990,
    "couponDiscount": 5000,
    "shipping": 2490,
    "total": 147480
  }
}
```

Shipping rules: `standard` R$ 24,90, `express` R$ 49,90. `standard` is free when
subtotal ≥ R$ 300,00 or when every line is flagged `freeShipping`.

### Coupons

| Code | Behaviour | Failure code |
|---|---|---|
| `PRIMEIRACOMPRA` | R$ 50,00 off | — |
| `TIMBRE10` | 10% off subtotal, capped at R$ 200,00 | — |
| `FRETEGRATIS` | shipping to zero on any method | — |
| `PALCO500` | R$ 100,00 off, requires subtotal ≥ R$ 500,00 | `COUPON_MIN_NOT_MET` |
| `VERAO2024` | expired | `COUPON_EXPIRED` |
| `SOMENTENOVOS` | 15% off, valid only if every line is `new` | `COUPON_NOT_APPLICABLE` |
| anything else | — | `COUPON_INVALID` |

Only one coupon at a time. Applying a second returns 409 `COUPON_ALREADY_APPLIED`.

## Checkout

### `POST /api/shipping/quote` — `{ cep }`
Brazilian CEP, 8 digits. `00000000` returns 422 `CEP_NOT_FOUND`. `99999999`
returns 500. Anything else returns options with an ETA derived deterministically
from the CEP digits — same CEP, same answer, every time.

### `POST /api/orders`

Body carries `shipping` (recipient, cep, street, number, complement, district,
city, state), `payment`, and `selectedShippingId`. Requires auth.

Payment is `{ method: 'card' | 'pix' | 'boleto', card? }`. Card number drives
the outcome:

| Card number | Result |
|---|---|
| `4111 1111 1111 1111` | approved |
| `4000 0000 0000 0002` | 402 `CARD_DECLINED` |
| `4000 0000 0000 9995` | 402 `INSUFFICIENT_FUNDS` |
| `4000 0000 0000 0119` | 500 `PAYMENT_PROCESSOR_ERROR` |
| `4000 0000 0000 0069` | 402 `CARD_EXPIRED` |

`pix` returns the order in `awaiting_payment` with a static payload string.
`boleto` returns a due date computed from the injected clock, not wall time.

A successful order decrements stock, empties the cart, and returns
`{ id, number, status, ... }`. Order numbers are sequential from the seed:
first order of a fresh store is always `TMB-100241`. Deterministic order numbers
are deliberate — assert on them.

If any line went out of stock between cart and order, return 409 `STOCK_CHANGED`
with the affected line ids and do not charge.

### `GET /api/orders` and `GET /api/orders/:id`
Auth required. 403 `FORBIDDEN` when the order belongs to someone else — this case
must exist, it is one of the more interesting things to test.

## Test control endpoints

Mounted only when `TIMBRE_TEST_MODE=1`. Return 404 otherwise, and assert that in
a test.

- `POST /api/test/reset` — restore every store to fixture state. Must complete in
  under 50ms; both suites call it in `beforeEach`.
- `POST /api/test/session` — `{ email }` returns a valid token without going
  through the login form. Use this to skip UI login in every test that isn't
  about login.
- `POST /api/test/clock` — `{ now }` sets the injected clock for boleto due dates
  and "listed X days ago" strings.
- `POST /api/test/failure` — `{ route, times, status }` arms the next N calls to a
  route to fail. This is how retry and error-state tests are driven without
  stubbing the network, and it's worth demonstrating alongside `cy.intercept`.

---

## Clarifications resolved while building milestone 1

Recorded here so the answers survive the session. Everything below is
implemented and covered by a test in `api/test/`.

### No floats means no floats

`No floats anywhere on the wire` is enforced literally, not only for money.
Ratings ride as **integer tenths of a star** (`rating: 48` is 4.8) and rates as
**integer percent** (`onTimeRate: 98`). Formatting happens once, in the client,
exactly like `price`. `api/test/wire.test.ts` walks every response body and
fails on any non-integer number.

### Fields added to `ProductSummary`

Two fields the listed shape did not name but the pages spec requires:

- `listedAt` — ISO instant. Drives the `newest` sort and every
  "anunciado há N dias" string. Derived from `LISTING_EPOCH` in the fixture, so
  the injected clock controls the rendered age.
- `sponsored` — boolean. Only listings flagged here may appear in the labelled
  sponsored row; nothing is ever interleaved with organic results.

### `stock` on products with variants

`ProductDetail` keeps a top-level `stock` for variant products, holding the
**sum across options** (`p-0103` reports 6 = 4 + 0 + 2). A card must be able to
render a stock state without knowing about variants. The authoritative number
for the buy path is the selected option's `stock`, and the cart validates
against that, never against the aggregate.

### Order ids

`id` and `number` are the same `TMB-` string. `GET /api/orders/TMB-100238`
is the route, and `/orders/:id` in the app carries the same value.

### Price range filtering

`minPrice` and `maxPrice` are both **inclusive**, and the facet buckets use the
same predicate, so a bucket's count always equals the result count of filtering
by that bucket's own numbers — asserted in `catalog.test.ts`. The fixture is
built so no product price ever sits exactly on a bucket boundary, which is what
makes inclusive-inclusive unambiguous; `fixtures.test.ts` guards it.

### Cart additions

- The cart carries `cep` (default `89010000`) because shipping ETA and the
  available methods depend on it, and the header's CEP control persists there.
- `PUT /api/cart/cep` — `{ cep }`, and `PUT /api/cart/shipping` —
  `{ shippingId }`. Selecting a method the CEP does not serve returns 422
  `SHIPPING_OPTION_UNAVAILABLE`.
- Each line carries `availableStock` so the quantity stepper can cap itself
  without a second request.
- Guests are keyed by `X-Cart-Id`. An unknown id yields a fresh cart rather than
  an error, so a stale client id can never dead-end the app.

### Coupon lifecycle

A coupon that stops qualifying after the cart changes (the subtotal drops below
`PALCO500`'s minimum, a used item joins a `SOMENTENOVOS` cart) is **removed** on
the next cart computation rather than kept in an impossible state. Applying is
still the only place a failure code is returned.

### Error codes beyond the tables above

The tables name the interesting domain failures. These generic codes exist for
the status codes the conventions section already promised, plus two operational
ones:

`MALFORMED_REQUEST` (400, includes a body carrying unknown fields, since request
schemas are strict), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `VALIDATION_ERROR`
(422, always with `fields`), `INTERNAL_ERROR` (500), `CART_EMPTY` (409, ordering
an empty cart), `SHIPPING_OPTION_UNAVAILABLE` (422), and `INJECTED_FAILURE`
(the default code armed by `POST /api/test/failure`).

`POST /api/test/failure` also accepts an optional `code`, so a test can arm a
specific documented failure rather than a generic one.

---

## Clarifications resolved while building milestone 3.2

### The API sends codes, not copy

Display text the platform owns is Platform copy and lives in the client's
locale files, keyed by a stable code (ADR 0001). The API therefore carries no
display labels:

- categories carry `slug`, never a `name`;
- facet values carry `value` and `count`, price buckets `value`, `min`, `max`
  and `count` — no `label`;
- shipping options and an order's shipping carry the method `id`, never a label.

Listing content keeps its labels because a seller wrote them: variant group
labels, option names, and spec label/value pairs are shown as written.
`api/test/catalog.test.ts` asserts the absence of the removed fields.

