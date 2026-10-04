import type { Cart, Order, ShippingQuoteResponse } from '@timbre/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addItem,
  createHarness,
  errorCodeOf,
  get,
  orderPayload,
  post,
  seedSession,
  type Harness,
} from './helpers.js'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

describe('POST /api/shipping/quote', () => {
  it('quotes the default header CEP', async () => {
    const response = await post(h.app, '/api/shipping/quote', { cep: '89010-000' })
    expect(response.statusCode).toBe(200)
    const body = response.json() as ShippingQuoteResponse
    expect(body.city).toBe('Blumenau')
    expect(body.state).toBe('SC')
    expect(body.options.find((option) => option.id === 'standard')!.etaDays).toBe(2)
  })

  it('drops the express option for Rio Branco', async () => {
    const body = (await post(h.app, '/api/shipping/quote', { cep: '69900-000' })).json() as ShippingQuoteResponse
    expect(body.options.map((option) => option.id)).toEqual(['standard'])
    expect(body.options[0]!.etaDays).toBe(9)
  })

  it('returns a field error for an unknown CEP', async () => {
    const response = await post(h.app, '/api/shipping/quote', { cep: '00000-000' })
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('CEP_NOT_FOUND')
    expect((response.json() as { error: { fields: Record<string, string> } }).error.fields).toHaveProperty('cep')
  })

  it('fails with a 500 for the error-trigger CEP', async () => {
    const response = await post(h.app, '/api/shipping/quote', { cep: '99999-999' })
    expect(response.statusCode).toBe(500)
    expect(errorCodeOf(response)).toBe('INTERNAL_ERROR')
  })

  it('answers a CEP outside the table deterministically', async () => {
    const first = await post(h.app, '/api/shipping/quote', { cep: '30110-001' })
    const second = await post(h.app, '/api/shipping/quote', { cep: '30110-001' })
    expect(first.body).toBe(second.body)
    expect((first.json() as ShippingQuoteResponse).state).toBe('MG')
  })

  it('rejects a malformed CEP', async () => {
    const response = await post(h.app, '/api/shipping/quote', { cep: '123' })
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/orders', () => {
  async function readyCart(email = 'ana.souza@timbre.test', productId = 'p-0104') {
    const token = await seedSession(h.app, email)
    await addItem(h.app, { productId }, { token })
    return token
  }

  it('numbers the first order of a fresh store TMB-100241', async () => {
    const token = await readyCart()
    const response = await post(h.app, '/api/orders', orderPayload(), { token })
    expect(response.statusCode).toBe(201)
    const order = response.json() as Order
    expect(order.number).toBe('TMB-100241')
    expect(order.id).toBe(order.number)
    expect(order.status).toBe('paid')
    expect(order.payment.cardLast4).toBe('1111')
  })

  it('keeps numbering sequential', async () => {
    const token = await readyCart()
    await post(h.app, '/api/orders', orderPayload(), { token })
    await addItem(h.app, { productId: 'p-0104' }, { token })
    const second = await post(h.app, '/api/orders', orderPayload(), { token })
    expect((second.json() as Order).number).toBe('TMB-100242')
  })

  it('decrements stock and empties the cart', async () => {
    const token = await readyCart('ana.souza@timbre.test', 'p-0106')
    const before = h.store.productById('p-0106')!.stock
    await post(h.app, '/api/orders', orderPayload(), { token })
    expect(h.store.productById('p-0106')!.stock).toBe(before! - 1)
    expect(((await get(h.app, '/api/cart', { token })).json() as Cart).lines).toHaveLength(0)
  })

  it('decrements the selected variant option, not the whole product', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(
      h.app,
      { productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue', quantity: 2 },
      { token },
    )
    await post(h.app, '/api/orders', orderPayload(), { token })
    const options = h.store.productById('p-0103')!.variants![0]!.options
    expect(options.map((option) => option.stock)).toEqual([4, 0, 0])
  })

  it.each([
    ['4000 0000 0000 0002', 402, 'CARD_DECLINED'],
    ['4000 0000 0000 9995', 402, 'INSUFFICIENT_FUNDS'],
    ['4000 0000 0000 0069', 402, 'CARD_EXPIRED'],
    ['4000 0000 0000 0119', 500, 'PAYMENT_PROCESSOR_ERROR'],
  ])('card %s fails with %i %s', async (cardNumber, status, code) => {
    const token = await readyCart()
    const response = await post(h.app, '/api/orders', orderPayload({ cardNumber }), { token })
    expect(response.statusCode).toBe(status)
    expect(errorCodeOf(response)).toBe(code)
  })

  it('keeps the cart intact after a decline and lets a good card retry', async () => {
    const token = await readyCart()
    const declined = await post(
      h.app,
      '/api/orders',
      orderPayload({ cardNumber: '4000 0000 0000 0002' }),
      { token },
    )
    expect(declined.statusCode).toBe(402)

    const cart = (await get(h.app, '/api/cart', { token })).json() as Cart
    expect(cart.lines).toHaveLength(1)
    expect(h.store.orders.some((order) => order.number === 'TMB-100241')).toBe(false)

    const retry = await post(h.app, '/api/orders', orderPayload(), { token })
    expect(retry.statusCode).toBe(201)
    expect((retry.json() as Order).number).toBe('TMB-100241')
  })

  it('rejects a card number that fails the Luhn check', async () => {
    const token = await readyCart()
    const response = await post(
      h.app,
      '/api/orders',
      orderPayload({ cardNumber: '4111 1111 1111 1112' }),
      { token },
    )
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('VALIDATION_ERROR')
  })

  it('returns pix awaiting payment with a static payload', async () => {
    const token = await readyCart()
    const order = (await post(h.app, '/api/orders', orderPayload({ method: 'pix' }), { token })).json() as Order
    expect(order.status).toBe('awaiting_payment')
    expect(order.payment.pixPayload).toContain('TIMBRE-PIX-100241')
  })

  it('derives the boleto due date from the injected clock', async () => {
    await post(h.app, '/api/test/clock', { now: '2026-03-10T09:00:00Z' })
    const token = await readyCart()
    const order = (await post(h.app, '/api/orders', orderPayload({ method: 'boleto' }), { token })).json() as Order
    expect(order.payment.boletoDueDate).toBe('2026-03-13')
    expect(order.createdAt).toBe('2026-03-10T09:00:00Z')
  })

  it('409s when the cart is empty', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    const response = await post(h.app, '/api/orders', orderPayload(), { token })
    expect(response.statusCode).toBe(409)
    expect(errorCodeOf(response)).toBe('CART_EMPTY')
  })

  it('409s with the affected line when stock ran out in the meantime', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0106', quantity: 3 }, { token })
    h.store.productById('p-0106')!.stock = 1

    const response = await post(h.app, '/api/orders', orderPayload(), { token })
    expect(response.statusCode).toBe(409)
    expect(errorCodeOf(response)).toBe('STOCK_CHANGED')
    expect((response.json() as { error: { lineIds: string[] } }).error.lineIds).toHaveLength(1)
    expect(h.store.productById('p-0106')!.stock).toBe(1)
    expect(h.store.orders.some((order) => order.number === 'TMB-100241')).toBe(false)
  })

  it('requires authentication', async () => {
    const response = await post(h.app, '/api/orders', orderPayload())
    expect(response.statusCode).toBe(401)
  })

  it('rejects a shipping method the CEP does not serve', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0104' }, { token })
    await post(h.app, '/api/test/clock', { now: '2026-08-10T12:00:00Z' })
    const cart = h.store.cartForUser('u-01')
    cart.cep = '69900000'

    const response = await post(h.app, '/api/orders', orderPayload({ selectedShippingId: 'express' }), { token })
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('SHIPPING_OPTION_UNAVAILABLE')
  })
})
