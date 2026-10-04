import type { Cart, Order, ProductDetail, ProductListResponse } from '@timbre/contracts'
import { coupons } from '@timbre/fixtures'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addItem,
  createHarness,
  errorCodeOf,
  findFloats,
  get,
  orderPayload,
  post,
  put,
  seedSession,
  type Harness,
} from './helpers.js'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

/** The rule from ADR 0002, restated independently of the implementation. */
const toUsd = (brl: number) => Math.round(brl / 5 + 1e-9)

const list = async (query: string): Promise<ProductListResponse> =>
  (await get(h.app, `/api/products${query}`)).json() as ProductListResponse

async function cartIn(currency: 'BRL' | 'USD', cartId: string): Promise<Cart> {
  return (await get(h.app, `/api/cart?currency=${currency}`, { cartId })).json() as Cart
}

async function guestCart(items: Array<{ productId: string; quantity?: number; variantOptionId?: string }>) {
  const cartId = ((await get(h.app, '/api/cart')).json() as Cart).id
  for (const item of items) {
    const response = await addItem(h.app, item, { cartId })
    expect(response.statusCode, JSON.stringify(response.json())).toBe(201)
  }
  return cartId
}

function expectSumsAddUp(cart: Cart) {
  for (const line of cart.lines) expect(line.lineTotal).toBe(line.unitPrice * line.quantity)
  expect(cart.totals.subtotal).toBe(cart.lines.reduce((sum, line) => sum + line.lineTotal, 0))
  expect(cart.totals.total).toBe(
    cart.totals.subtotal - cart.totals.couponDiscount + cart.totals.shipping,
  )
  const selected = cart.shippingOptions.find((option) => option.id === cart.selectedShippingId)!
  expect(cart.totals.shipping).toBe(selected.price)
}

describe('the Demo exchange rate', () => {
  it('is exposed as an integer: US$ 1 = R$ 5', async () => {
    const response = await get(h.app, '/api/exchange-rate')
    expect(response.json()).toEqual({ base: 'USD', quote: 'BRL', rate: 5 })
  })
})

describe('currency on the wire', () => {
  it('defaults to BRL, byte for byte', async () => {
    for (const url of ['/api/products?q=strymon', '/api/products/p-0103', '/api/sellers/vintage-room']) {
      const omitted = await get(h.app, url)
      const explicit = await get(h.app, `${url}${url.includes('?') ? '&' : '?'}currency=BRL`)
      expect(explicit.body, url).toBe(omitted.body)
      expect((omitted.json() as { currency: string }).currency).toBe('BRL')
    }
  })

  it('labels every money-bearing response with its currency', async () => {
    const cartId = await guestCart([{ productId: 'p-0104' }])
    const responses = [
      await get(h.app, '/api/products?currency=USD'),
      await get(h.app, '/api/products/p-0104?currency=USD'),
      await get(h.app, '/api/sellers/casa-do-som?currency=USD'),
      await get(h.app, '/api/cart?currency=USD', { cartId }),
      await post(h.app, '/api/shipping/quote?currency=USD', { cep: '01310-100' }),
    ]
    for (const response of responses) {
      expect((response.json() as { currency: string }).currency).toBe('USD')
    }
  })

  it('rejects an unknown currency before changing anything', async () => {
    const cartId = await guestCart([])
    const response = await addItem(h.app, { productId: 'p-0104' }, { cartId, headers: {} })
    expect(response.statusCode).toBe(201)
    const rejected = await post(
      h.app,
      '/api/cart/items?currency=EUR',
      { productId: 'p-0105', quantity: 1 },
      { cartId },
    )
    expect(rejected.statusCode).toBe(422)
    expect(errorCodeOf(rejected)).toBe('VALIDATION_ERROR')
    expect((await cartIn('BRL', cartId)).lines.map((line) => line.product.id)).toEqual(['p-0104'])
  })

  it('stays integer-only and deterministic in USD', async () => {
    const urls = ['/api/products?currency=USD&perPage=60', '/api/products/p-0103?currency=USD']
    for (const url of urls) {
      const first = await get(h.app, url)
      expect(findFloats(first.json())).toEqual([])
      expect((await get(h.app, url)).body).toBe(first.body)
    }
  })
})

describe('conversion', () => {
  it('prices all 60 products at their BRL price divided by the rate, rounded half-up', async () => {
    const brl = await list('?perPage=60')
    const usd = await list('?perPage=60&currency=USD')
    expect(usd.items.map((item) => item.id)).toEqual(brl.items.map((item) => item.id))
    expect(usd.items).toHaveLength(60)
    usd.items.forEach((item, index) => {
      const source = brl.items[index]!
      expect(item.price, item.id).toBe(toUsd(source.price))
      expect(item.listPrice, item.id).toBe(source.listPrice === null ? null : toUsd(source.listPrice))
    })
  })

  it('prices every variant option the same way, so base plus delta matches', async () => {
    const all = await list('?perPage=60')
    const withVariants: ProductDetail[] = []
    for (const item of all.items) {
      const detail = (await get(h.app, `/api/products/${item.id}`)).json() as ProductDetail
      if (detail.variants) withVariants.push(detail)
    }
    expect(withVariants.length).toBeGreaterThan(0)
    for (const brl of withVariants) {
      const usd = (await get(h.app, `/api/products/${brl.id}?currency=USD`)).json() as ProductDetail
      brl.variants!.forEach((group, g) => {
        group.options.forEach((option, o) => {
          const usdOption = usd.variants![g]!.options[o]!
          expect(usd.price + usdOption.priceDelta, option.id).toBe(toUsd(brl.price + option.priceDelta))
        })
      })
    }
  })

  it('rounds half-up at the cent: R$ 0,02 is US$ 0.00 and R$ 0,03 is US$ 0.01', () => {
    expect(toUsd(2)).toBe(0)
    expect(toUsd(3)).toBe(1)
    expect(toUsd(129990)).toBe(25998)
  })
})

describe('eligibility is decided in BRL', () => {
  it('denies free shipping to a R$ 299,99 cart in both currencies', async () => {
    const product = h.store.productById('p-0104')!
    expect(product.freeShipping).toBe(false)
    product.price = 29999
    const cartId = await guestCart([{ productId: 'p-0104' }])

    const brl = await cartIn('BRL', cartId)
    const usd = await cartIn('USD', cartId)
    expect(brl.totals.subtotal).toBe(29999)
    // The trap: in dollars this subtotal rounds to exactly the converted threshold.
    expect(usd.totals.subtotal).toBe(6000)
    expect(brl.totals.shipping).toBe(2490)
    expect(usd.totals.shipping).toBe(498)
  })

  it('grants free shipping from R$ 300,00 in both currencies', async () => {
    h.store.productById('p-0104')!.price = 30000
    const cartId = await guestCart([{ productId: 'p-0104' }])
    expect((await cartIn('BRL', cartId)).totals.shipping).toBe(0)
    expect((await cartIn('USD', cartId)).totals.shipping).toBe(0)
  })

  it('gives every coupon the same outcome in both currencies', async () => {
    const cheapUsed = (await list('?condition=used&sort=price-asc&perPage=1')).items[0]!
    const dearNew = (await list('?condition=new&sort=price-desc&perPage=1')).items[0]!
    const shapes = [[{ productId: cheapUsed.id }], [{ productId: dearNew.id }]]

    for (const coupon of coupons) {
      for (const shape of shapes) {
        const outcomes = []
        for (const currency of ['BRL', 'USD'] as const) {
          const cartId = await guestCart(shape)
          const applied = await post(h.app, `/api/cart/coupon?currency=${currency}`, { code: coupon.code }, { cartId })
          outcomes.push({ currency, status: applied.statusCode, code: errorCodeOf(applied), body: applied.json() as Cart })
        }
        const [brl, usd] = outcomes as [(typeof outcomes)[0], (typeof outcomes)[0]]
        const label = `${coupon.code} on ${shape[0]!.productId}`
        expect(usd.status, label).toBe(brl.status)
        expect(usd.code, label).toBe(brl.code)
        if (brl.status === 200) {
          expect(usd.body.coupon?.code, label).toBe(brl.body.coupon?.code)
          expect(usd.body.totals.couponDiscount, label).toBe(
            Math.min(toUsd(brl.body.totals.couponDiscount), usd.body.totals.subtotal),
          )
          expect(usd.body.totals.shipping === 0, label).toBe(brl.body.totals.shipping === 0)
          expectSumsAddUp(usd.body)
        }
      }
    }
  })
})

describe('sums add up exactly in USD', () => {
  it('for multi-seller carts with variants and quantities', async () => {
    const cartId = await guestCart([
      { productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue' },
      { productId: 'p-0602', quantity: 3 },
      { productId: 'p-0104', quantity: 2 },
    ])
    const usd = await cartIn('USD', cartId)
    expect(new Set(usd.lines.map((line) => line.product.seller.id)).size).toBeGreaterThan(1)
    expectSumsAddUp(usd)
    await post(h.app, '/api/cart/coupon?currency=USD', { code: 'TIMBRE10' }, { cartId })
    await put(h.app, '/api/cart/shipping?currency=USD', { shippingId: 'express' }, { cartId })
    const discounted = await cartIn('USD', cartId)
    expect(discounted.totals.couponDiscount).toBeGreaterThan(0)
    expectSumsAddUp(discounted)
  })

  it('converts shipping prices like any amount', async () => {
    const quote = (await post(h.app, '/api/shipping/quote?currency=USD', { cep: '01310-100' })).json() as {
      options: Array<{ id: string; price: number }>
    }
    expect(quote.options).toEqual([
      expect.objectContaining({ id: 'standard', price: 498 }),
      expect.objectContaining({ id: 'express', price: 998 }),
    ])
  })
})

describe('orders keep their currency', () => {
  it('charges a USD order in USD and never reconverts it', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0104' }, { token })
    const created = await post(h.app, '/api/orders?currency=USD', orderPayload(), { token })
    expect(created.statusCode).toBe(201)
    const order = created.json() as Order
    expect(order.number).toBe('TMB-100241')
    expect(order.currency).toBe('USD')
    expect(order.totals.subtotal).toBe(toUsd(h.store.productById('p-0104')!.price))
    expect(order.totals.total).toBe(order.totals.subtotal - order.totals.couponDiscount + order.totals.shipping)

    for (const currency of ['BRL', 'USD']) {
      const read = (await get(h.app, `/api/orders/${order.id}?currency=${currency}`, { token })).json() as Order
      expect(read).toEqual(order)
    }
  })

  it('keeps fixture orders in BRL under any request currency', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    const brl = (await get(h.app, '/api/orders/TMB-100236', { token })).json() as Order
    const usd = (await get(h.app, '/api/orders/TMB-100236?currency=USD', { token })).json() as Order
    expect(brl.currency).toBe('BRL')
    expect(usd).toEqual(brl)
  })

  it('leaves cart and stock untouched when the payment method is unavailable', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0104' }, { token })
    const stock = h.store.productById('p-0104')!.stock
    const rejected = await post(h.app, '/api/orders?currency=USD', orderPayload({ method: 'boleto' }), { token })
    expect(errorCodeOf(rejected)).toBe('PAYMENT_METHOD_UNAVAILABLE')
    expect(h.store.productById('p-0104')!.stock).toBe(stock)
    const cart = (await get(h.app, '/api/cart?currency=USD', { token })).json() as Cart
    expect(cart.lines).toHaveLength(1)
    // Pix and boleto still work in BRL.
    expect((await post(h.app, '/api/orders', orderPayload({ method: 'pix' }), { token })).statusCode).toBe(201)
  })
})

describe('price filtering in USD', () => {
  it('offers the five ranges in dollar cents', async () => {
    const usd = await list('?currency=USD')
    expect(usd.facets.price.map((bucket) => bucket.value)).toEqual([
      '0-4000',
      '4000-10000',
      '10000-30000',
      '30000-80000',
      '80000+',
    ])
  })

  it('counts each bucket exactly as filtering by its bounds', async () => {
    const usd = await list('?currency=USD')
    let total = 0
    for (const bucket of usd.facets.price) {
      const query = `?currency=USD&minPrice=${bucket.min}${bucket.max === null ? '' : `&maxPrice=${bucket.max}`}`
      expect((await list(query)).total, bucket.value).toBe(bucket.count)
      total += bucket.count
    }
    expect(total).toBe(60)
  })

  it('reads minPrice and maxPrice in the request currency', async () => {
    const usd = await list('?currency=USD&minPrice=4000&maxPrice=10000&perPage=60')
    const brl = await list('?minPrice=20000&maxPrice=50000&perPage=60')
    expect(usd.items.map((item) => item.id)).toEqual(brl.items.map((item) => item.id))
  })
})
