# Seed data

Lives in `packages/fixtures`, plain TypeScript modules exporting frozen arrays.
The API deep-clones them on reset so mutation never leaks between tests.

**The seed is a test fixture first and a catalog second.** Every edge case a test
needs must exist here by construction, not by luck. Nothing is randomly generated
at runtime — if you need variety, write a deterministic generator with a fixed
seed and commit its output.

## Categories

| slug | name |
|---|---|
| `guitars` | Guitarras e Baixos |
| `keyboards` | Teclados e Sintetizadores |
| `drums` | Bateria e Percussão |
| `studio` | Estúdio e Gravação |
| `pedals` | Pedais e Efeitos |
| `accessories` | Acessórios |

## Sellers — 8 total

Fixed distribution so seller filters and tier marks are all reachable:

| id | name | tier | state | rating | products |
|---|---|---|---|---|---|
| `s-01` | Casa do Som | PLATINUM | SP | 4.8 | 14 |
| `s-02` | Áudio Prime | PLATINUM | SP | 4.9 | 11 |
| `s-03` | Loja do Músico | GOLD | RJ | 4.5 | 10 |
| `s-04` | Studio Norte | GOLD | PR | 4.4 | 8 |
| `s-05` | Instrumentos SC | SILVER | SC | 4.1 | 7 |
| `s-06` | Marcos Andrade | — | MG | 4.7 | 5 |
| `s-07` | Julia Ferraz | — | BA | 3.9 | 3 |
| `s-08` | Vintage Room | SILVER | RS | 4.6 | 2 |

`s-08` having only two products is deliberate: it exercises a seller page that
does not paginate. `s-07` is the only sub-4.0 rating, for rating-sort assertions.

## Products — 60 total

Distribution: 14 guitars, 10 keyboards, 8 drums, 10 studio, 9 pedals,
9 accessories. Conditions: 24 new, 22 like-new, 14 used. 19 flagged
`freeShipping`. 21 carry a `listPrice` above `price`.

Price spread must cover R$ 39,90 to R$ 8.990,00 with at least four products in
each of these buckets, since they are the filter presets:
`0–20000`, `20000–50000`, `50000–150000`, `150000–400000`, `400000+` (centavos).

### Required anchor products — exact values, do not alter

These carry the edge cases. Everything else is filler.

| id | name | why it exists |
|---|---|---|
| `p-0101` | Fender Player Stratocaster HSS | `stock: 1` → `ÚLTIMA UNIDADE` badge, quantity stepper cap at 1 |
| `p-0102` | Gibson Les Paul Studio 2018 | `stock: 0` → `ESGOTADO`, disabled buy path, "Avise-me" form |
| `p-0103` | Squier Classic Vibe Telecaster | variant group **Cor**: Butterscotch (stock 4), Black (stock 0), Sonic Blue (stock 2, `priceDelta: 15000`). One sold-out option, one with a price delta. |
| `p-0104` | Tagima TW-61 Woodstock | cheapest guitar, `price: 129900`, `listPrice: 169900` → -24% |
| `p-0201` | Roland Juno-DS61 | `stock: 3` → "Últimas 3 unidades" notice |
| `p-0202` | Moog Subsequent 37 | `price: 899000`, most expensive item, top of `price-desc` sort |
| `p-0301` | Pearl Export EXX 5 peças | heaviest item, never `freeShipping`, forces paid shipping |
| `p-0401` | Focusrite Scarlett 2i2 4ª ger | condition `new`, used by the `SOMENTENOVOS` coupon happy path |
| `p-0501` | Boss DS-1 Distortion | `price: 3990`, cheapest item, bottom of `price-asc` sort |
| `p-0502` | Strymon BigSky | shared across two sellers as separate listings, different prices and conditions — the classic marketplace duplicate-title case |
| `p-0601` | Cabo P10 Santo Angelo 3m | `freeShipping: true` at a low price, proving free shipping is a product flag not a threshold |
| `p-0602` | Palheta Dunlop Tortex (pacote 12) | only product with `reviewCount: 0` → empty rating state |

`p-0103` and `p-0502` are the two most valuable fixtures in the file. Do not
simplify them away.

## Users

| email | password | notes |
|---|---|---|
| `ana.souza@timbre.test` | `Teste@1234` | clean account, no orders, no saved address |
| `bruno.lima@timbre.test` | `Teste@1234` | 3 past orders in different statuses, 2 saved addresses |
| `bloqueado@timbre.test` | `Teste@1234` | 403 `ACCOUNT_LOCKED` |
| `lento@timbre.test` | `Teste@1234` | logs in successfully after a forced 3s delay |

Bruno's orders cover `awaiting_payment`, `shipped`, and `delivered`, and one
of them belongs to Ana — no, it belongs to a fifth hidden user, so that
`GET /api/orders/:id` can return 403 for a real, existing order id. That id is
`TMB-100238` and it must be reachable in tests.

## Order numbering

Sequential, prefix `TMB-`, starting at `100241` on a fresh store. Bruno's three
seeded orders occupy `100236`, `100238`, `100240`. After
`POST /api/test/reset`, the next order created is always `TMB-100241` — assert
on it directly.

## CEPs

| CEP | Behaviour |
|---|---|
| `89010-000` | Blumenau/SC, default in the header, 2-day standard ETA |
| `01310-100` | São Paulo/SP, 1-day |
| `69900-000` | Rio Branco/AC, 9-day, express unavailable |
| `00000-000` | 422 `CEP_NOT_FOUND` |
| `99999-999` | 500 |

Rio Branco having no express option matters: it is the only way to test the
shipping method list changing shape rather than just price.

## Images

Do not hotlink. Generate 60 placeholder SVGs at build time into
`app/public/img/products/<id>.svg` — a flat `--color-sunken` field with the brand
name in Archivo and a category glyph. They must be committed, so screenshots and
visual comparisons stay stable across machines and CI. Consistent placeholders
look more deliberate than mismatched stock photos anyway.

---

## Clarifications resolved while building milestone 1

### Order ownership (the paragraph that corrects itself)

The users section says Bruno has three orders covering the three statuses, then
says his orders occupy `100236`, `100238`, `100240` — while also saying `100238`
belongs to the hidden fifth user. Both cannot hold. Resolved by using all five
numbers with no gap:

| Order | Owner | Status |
|---|---|---|
| `TMB-100236` | Bruno (`u-02`) | `delivered` |
| `TMB-100237` | hidden user (`u-05`) | `delivered` |
| `TMB-100238` | hidden user (`u-05`) | `shipped` |
| `TMB-100239` | Bruno (`u-02`) | `shipped` |
| `TMB-100240` | Bruno (`u-02`) | `awaiting_payment` |

Bruno keeps exactly three orders in the three documented statuses, `TMB-100238`
is a real order owned by somebody else so the 403 is genuine, and the next order
on a fresh store is still `TMB-100241`.

The hidden fifth user is `u-05`, Ricardo Nunes, `ricardo.nunes@timbre.test`. It
is a normal, loginable account — "hidden" only means it is absent from the
documented account table.

### Time

`FIXTURE_NOW` is `2026-08-10T12:00:00Z`; every fresh store starts there and
`POST /api/test/clock` moves it. Listing dates derive from `LISTING_EPOCH` (the
same instant) via a fixed function of the product id, giving 60 unique dates
spread over ~180 days with no randomness and no wall-clock read.

### Sponsored listings

Six products carry `sponsored: true` and are the only ones eligible for the
labelled row: `p-0101`, `p-0203`, `p-0303`, `p-0401`, `p-0504`, `p-0601`.

### The second Strymon BigSky

`p-0502` (Casa do Som, new, R$ 4.499,00) and `p-0503` (Marcos Andrade,
like-new, R$ 3.799,00) share the name `Strymon BigSky` and the slug
`strymon-bigsky`. The id in the URL is what disambiguates them.

### Images

Each product carries exactly one image: `/img/products/<id>.svg`, so `images[]`
has a single entry. The 60 placeholder SVGs are generated and committed in the
app milestone, when the design tokens they reference exist.
