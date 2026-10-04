import type { Cart } from '@timbre/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addItem,
  createHarness,
  del,
  errorCodeOf,
  get,
  patch,
  post,
  put,
  seedSession,
  type Harness,
} from './helpers.js'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

async function guestCart(): Promise<string> {
  const response = await get(h.app, '/api/cart')
  return (response.json() as Cart).id
}

const cartOf = (response: { json: () => unknown }) => response.json() as Cart

describe('cart lines', () => {
  it('creates a cart from the fixture sequence and starts empty', async () => {
    const cart = cartOf(await get(h.app, '/api/cart'))
    expect(cart.id).toBe('cart_1000')
    expect(cart.lines).toEqual([])
    expect(cart.totals).toEqual({ subtotal: 0, couponDiscount: 0, shipping: 0, total: 0 })
  })

  it('adds a line and computes totals server-side', async () => {
    const cartId = await guestCart()
    const cart = cartOf(await addItem(h.app, { productId: 'p-0104' }, { cartId }))
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]!.unitPrice).toBe(129900)
    expect(cart.totals.subtotal).toBe(129900)
  })

  it('increments an existing line instead of duplicating it', async () => {
    const cartId = await guestCart()
    await addItem(h.app, { productId: 'p-0104', quantity: 2 }, { cartId })
    const cart = cartOf(await addItem(h.app, { productId: 'p-0104', quantity: 3 }, { cartId }))
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]!.quantity).toBe(5)
  })

  it('applies the variant price delta and tracks per-option stock', async () => {
    const cartId = await guestCart()
    const cart = cartOf(
      await addItem(
        h.app,
        { productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue', quantity: 2 },
        { cartId },
      ),
    )
    expect(cart.lines[0]!.unitPrice).toBe(329900 + 15000)
    expect(cart.lines[0]!.variant?.optionName).toBe('Sonic Blue')
    expect(cart.lines[0]!.availableStock).toBe(2)
  })

  it('refuses the sold-out variant option with the available count', async () => {
    const cartId = await guestCart()
    const response = await addItem(
      h.app,
      { productId: 'p-0103', variantOptionId: 'v-0103-black' },
      { cartId },
    )
    expect(response.statusCode).toBe(409)
    expect(errorCodeOf(response)).toBe('INSUFFICIENT_STOCK')
    expect((response.json() as { error: { available: number } }).error.available).toBe(0)
  })

  it('refuses more units than the product has', async () => {
    const cartId = await guestCart()
    const response = await addItem(h.app, { productId: 'p-0101', quantity: 2 }, { cartId })
    expect(response.statusCode).toBe(409)
    expect((response.json() as { error: { available: number } }).error.available).toBe(1)
  })

  it('requires a variant option for a product that has variants', async () => {
    const cartId = await guestCart()
    const response = await addItem(h.app, { productId: 'p-0103' }, { cartId })
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('VALIDATION_ERROR')
  })

  it('updates and removes lines', async () => {
    const cartId = await guestCart()
    const added = cartOf(await addItem(h.app, { productId: 'p-0104', quantity: 2 }, { cartId }))
    const lineId = added.lines[0]!.id

    const updated = cartOf(await patch(h.app, `/api/cart/items/${lineId}`, { quantity: 4 }, { cartId }))
    expect(updated.lines[0]!.quantity).toBe(4)

    const zeroed = cartOf(await patch(h.app, `/api/cart/items/${lineId}`, { quantity: 0 }, { cartId }))
    expect(zeroed.lines).toHaveLength(0)

    const missing = await del(h.app, `/api/cart/items/${lineId}`, { cartId })
    expect(missing.statusCode).toBe(404)
  })

  it('survives a reload because it lives on the server', async () => {
    const cartId = await guestCart()
    await addItem(h.app, { productId: 'p-0104' }, { cartId })
    const reloaded = cartOf(await get(h.app, '/api/cart', { cartId }))
    expect(reloaded.lines).toHaveLength(1)
  })

  it('merges a guest cart into the user cart on login', async () => {
    const cartId = await guestCart()
    await addItem(h.app, { productId: 'p-0104', quantity: 2 }, { cartId })

    const login = await post(
      h.app,
      '/api/auth/login',
      { email: 'ana.souza@timbre.test', password: 'Teste@1234' },
      { cartId },
    )
    const token = (login.json() as { token: string }).token

    const merged = cartOf(await get(h.app, '/api/cart', { token }))
    expect(merged.lines).toHaveLength(1)
    expect(merged.lines[0]!.quantity).toBe(2)
    expect(h.store.cartById(cartId)).toBeUndefined()
  })
})

describe('shipping rules', () => {
  it('charges standard shipping below the free threshold', async () => {
    const cartId = await guestCart()
    const cart = cartOf(await addItem(h.app, { productId: 'p-0602' }, { cartId }))
    expect(cart.totals.subtotal).toBe(4990)
    expect(cart.totals.shipping).toBe(2490)
  })

  it('makes standard shipping free from R$ 300,00', async () => {
    const cartId = await guestCart()
    const cart = cartOf(await addItem(h.app, { productId: 'p-0604' }, { cartId }))
    expect(cart.totals.subtotal).toBe(39900)
    expect(cart.totals.shipping).toBe(0)
  })

  it('honours the free shipping flag regardless of price', async () => {
    const cartId = await guestCart()
    const cart = cartOf(await addItem(h.app, { productId: 'p-0601' }, { cartId }))
    expect(cart.totals.subtotal).toBe(8990)
    expect(cart.totals.shipping).toBe(0)
  })

  it('drops the express option for Rio Branco', async () => {
    const cartId = await guestCart()
    await addItem(h.app, { productId: 'p-0602' }, { cartId })
    const cart = cartOf(await put(h.app, '/api/cart/cep', { cep: '69900-000' }, { cartId }))
    expect(cart.shippingOptions.map((option) => option.id)).toEqual(['standard'])
    expect(cart.shippingOptions[0]!.etaDays).toBe(9)

    const response = await put(h.app, '/api/cart/shipping', { shippingId: 'express' }, { cartId })
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('SHIPPING_OPTION_UNAVAILABLE')
  })

  it('switches to express and re-prices the total', async () => {
    const cartId = await guestCart()
    await addItem(h.app, { productId: 'p-0602' }, { cartId })
    const cart = cartOf(await put(h.app, '/api/cart/shipping', { shippingId: 'express' }, { cartId }))
    expect(cart.selectedShippingId).toBe('express')
    expect(cart.totals.shipping).toBe(4990)
    expect(cart.totals.total).toBe(4990 + 4990)
  })
})

describe('the coupon matrix', () => {
  async function cartWith(productIds: string[], quantity = 1): Promise<string> {
    const cartId = await guestCart()
    for (const productId of productIds) {
      await addItem(h.app, { productId, quantity }, { cartId })
    }
    return cartId
  }

  const apply = (cartId: string, code: string) => post(h.app, '/api/cart/coupon', { code }, { cartId })

  it('PRIMEIRACOMPRA takes R$ 50,00 off', async () => {
    const cartId = await cartWith(['p-0104'])
    const cart = cartOf(await apply(cartId, 'PRIMEIRACOMPRA'))
    expect(cart.coupon).toEqual({ code: 'PRIMEIRACOMPRA', discount: 5000 })
    expect(cart.totals.total).toBe(129900 - 5000)
  })

  it('TIMBRE10 takes 10% capped at R$ 200,00', async () => {
    const cheap = await cartWith(['p-0602'])
    expect(cartOf(await apply(cheap, 'TIMBRE10')).coupon!.discount).toBe(499)

    const dear = await cartWith(['p-0202'])
    expect(cartOf(await apply(dear, 'TIMBRE10')).coupon!.discount).toBe(20000)
  })

  it('FRETEGRATIS zeroes any method', async () => {
    const cartId = await cartWith(['p-0602'])
    await put(h.app, '/api/cart/shipping', { shippingId: 'express' }, { cartId })
    const cart = cartOf(await apply(cartId, 'FRETEGRATIS'))
    expect(cart.shippingOptions.every((option) => option.price === 0)).toBe(true)
    expect(cart.totals.shipping).toBe(0)
    expect(cart.totals.total).toBe(4990)
  })

  it('PALCO500 requires a subtotal of R$ 500,00', async () => {
    const small = await cartWith(['p-0602'])
    const rejected = await apply(small, 'PALCO500')
    expect(rejected.statusCode).toBe(422)
    expect(errorCodeOf(rejected)).toBe('COUPON_MIN_NOT_MET')

    const big = await cartWith(['p-0104'])
    expect(cartOf(await apply(big, 'PALCO500')).coupon!.discount).toBe(10000)
  })

  it('VERAO2024 is expired against the injected clock', async () => {
    const cartId = await cartWith(['p-0104'])
    const response = await apply(cartId, 'VERAO2024')
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('COUPON_EXPIRED')
  })

  it('VERAO2024 applies once the clock is moved back before its expiry', async () => {
    await post(h.app, '/api/test/clock', { now: '2024-06-01T12:00:00Z' })
    const cartId = await cartWith(['p-0104'])
    expect(cartOf(await apply(cartId, 'VERAO2024')).coupon!.discount).toBe(25980)
  })

  it('SOMENTENOVOS applies only when every line is new', async () => {
    const allNew = await cartWith(['p-0401'])
    expect(cartOf(await apply(allNew, 'SOMENTENOVOS')).coupon!.discount).toBe(28485)

    const mixed = await cartWith(['p-0401', 'p-0501'])
    const response = await apply(mixed, 'SOMENTENOVOS')
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('COUPON_NOT_APPLICABLE')
  })

  it('rejects an unknown code', async () => {
    const cartId = await cartWith(['p-0104'])
    const response = await apply(cartId, 'NAOEXISTE')
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('COUPON_INVALID')
  })

  it('allows only one coupon at a time', async () => {
    const cartId = await cartWith(['p-0104'])
    await apply(cartId, 'PRIMEIRACOMPRA')
    const second = await apply(cartId, 'TIMBRE10')
    expect(second.statusCode).toBe(409)
    expect(errorCodeOf(second)).toBe('COUPON_ALREADY_APPLIED')

    const cleared = cartOf(await del(h.app, '/api/cart/coupon', { cartId }))
    expect(cleared.coupon).toBeNull()
    expect(cartOf(await apply(cartId, 'TIMBRE10')).coupon!.code).toBe('TIMBRE10')
  })

  it('drops a coupon that stopped qualifying after the cart changed', async () => {
    const cartId = await cartWith(['p-0104'])
    await apply(cartId, 'PALCO500')
    const lineId = cartOf(await get(h.app, '/api/cart', { cartId })).lines[0]!.id
    const emptied = cartOf(await patch(h.app, `/api/cart/items/${lineId}`, { quantity: 0 }, { cartId }))
    expect(emptied.coupon).toBeNull()
  })

  it('seeds a cart over the API for an authenticated user', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    const cart = cartOf(await addItem(h.app, { productId: 'p-0104' }, { token }))
    expect(cart.lines).toHaveLength(1)
    expect(cartOf(await get(h.app, '/api/cart', { token })).lines).toHaveLength(1)
  })
})
