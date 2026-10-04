import { errorCodeSchema, errorEnvelopeSchema, type ErrorCode } from '@timbre/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addItem,
  createHarness,
  get,
  orderPayload,
  post,
  put,
  seedSession,
  type Harness,
} from './helpers.js'

let h: Harness

const reached = new Set<ErrorCode>()

beforeEach(async () => {
  h = await createHarness()
})

async function expectCode(
  response: { statusCode: number; json: () => unknown },
  code: ErrorCode,
  status: number,
) {
  const parsed = errorEnvelopeSchema.safeParse(response.json())
  expect(parsed.success, `envelope inválido para ${code}: ${JSON.stringify(response.json())}`).toBe(true)
  expect(parsed.data!.error.code).toBe(code)
  expect(response.statusCode).toBe(status)
  reached.add(code)
}

async function guestCartId(): Promise<string> {
  return ((await get(h.app, '/api/cart')).json() as { id: string }).id
}

describe('every documented error code is reachable', () => {
  it('MALFORMED_REQUEST — a body carrying unknown fields', async () => {
    const response = await post(h.app, '/api/auth/login', {
      email: 'ana.souza@timbre.test',
      password: 'Teste@1234',
      extra: 1,
    })
    await expectCode(response, 'MALFORMED_REQUEST', 400)
  })

  it('UNAUTHORIZED — no bearer token', async () => {
    await expectCode(await get(h.app, '/api/auth/me'), 'UNAUTHORIZED', 401)
  })

  it('FORBIDDEN — somebody else’s order', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    await expectCode(await get(h.app, '/api/orders/TMB-100238', { token }), 'FORBIDDEN', 403)
  })

  it('NOT_FOUND — unknown product id', async () => {
    await expectCode(await get(h.app, '/api/products/p-9999'), 'NOT_FOUND', 404)
  })

  it('VALIDATION_ERROR — password below the shared rules', async () => {
    const response = await post(h.app, '/api/auth/register', {
      name: 'Carla Dias',
      email: 'carla@timbre.test',
      password: 'fraca',
    })
    await expectCode(response, 'VALIDATION_ERROR', 422)
  })

  it('INTERNAL_ERROR — the CEP that always fails', async () => {
    await expectCode(
      await post(h.app, '/api/shipping/quote', { cep: '99999-999' }),
      'INTERNAL_ERROR',
      500,
    )
  })

  it('INVALID_CREDENTIALS — wrong password', async () => {
    const response = await post(h.app, '/api/auth/login', {
      email: 'ana.souza@timbre.test',
      password: 'Errada@1234',
    })
    await expectCode(response, 'INVALID_CREDENTIALS', 401)
  })

  it('ACCOUNT_LOCKED — the blocked account', async () => {
    const response = await post(h.app, '/api/auth/login', {
      email: 'bloqueado@timbre.test',
      password: 'Teste@1234',
    })
    await expectCode(response, 'ACCOUNT_LOCKED', 403)
  })

  it('EMAIL_TAKEN — registering an existing address', async () => {
    const response = await post(h.app, '/api/auth/register', {
      name: 'Outra Ana',
      email: 'ana.souza@timbre.test',
      password: 'Teste@1234',
    })
    await expectCode(response, 'EMAIL_TAKEN', 422)
  })

  it('INSUFFICIENT_STOCK — two units of the last one', async () => {
    const cartId = await guestCartId()
    const response = await addItem(h.app, { productId: 'p-0101', quantity: 2 }, { cartId })
    await expectCode(response, 'INSUFFICIENT_STOCK', 409)
    expect((response.json() as { error: { available: number } }).error.available).toBe(1)
  })

  it('CART_EMPTY — checking out with nothing in the cart', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await expectCode(await post(h.app, '/api/orders', orderPayload(), { token }), 'CART_EMPTY', 409)
  })

  it('COUPON_INVALID — a code that does not exist', async () => {
    const cartId = await guestCartId()
    await addItem(h.app, { productId: 'p-0104' }, { cartId })
    await expectCode(
      await post(h.app, '/api/cart/coupon', { code: 'NAOEXISTE' }, { cartId }),
      'COUPON_INVALID',
      422,
    )
  })

  it('COUPON_EXPIRED — VERAO2024 against the injected clock', async () => {
    const cartId = await guestCartId()
    await addItem(h.app, { productId: 'p-0104' }, { cartId })
    await expectCode(
      await post(h.app, '/api/cart/coupon', { code: 'VERAO2024' }, { cartId }),
      'COUPON_EXPIRED',
      422,
    )
  })

  it('COUPON_MIN_NOT_MET — PALCO500 under R$ 500,00', async () => {
    const cartId = await guestCartId()
    await addItem(h.app, { productId: 'p-0602' }, { cartId })
    await expectCode(
      await post(h.app, '/api/cart/coupon', { code: 'PALCO500' }, { cartId }),
      'COUPON_MIN_NOT_MET',
      422,
    )
  })

  it('COUPON_NOT_APPLICABLE — SOMENTENOVOS with a used item', async () => {
    const cartId = await guestCartId()
    await addItem(h.app, { productId: 'p-0501' }, { cartId })
    await expectCode(
      await post(h.app, '/api/cart/coupon', { code: 'SOMENTENOVOS' }, { cartId }),
      'COUPON_NOT_APPLICABLE',
      422,
    )
  })

  it('COUPON_ALREADY_APPLIED — a second coupon', async () => {
    const cartId = await guestCartId()
    await addItem(h.app, { productId: 'p-0104' }, { cartId })
    await post(h.app, '/api/cart/coupon', { code: 'PRIMEIRACOMPRA' }, { cartId })
    await expectCode(
      await post(h.app, '/api/cart/coupon', { code: 'TIMBRE10' }, { cartId }),
      'COUPON_ALREADY_APPLIED',
      409,
    )
  })

  it('CEP_NOT_FOUND — the unknown CEP', async () => {
    await expectCode(
      await post(h.app, '/api/shipping/quote', { cep: '00000-000' }),
      'CEP_NOT_FOUND',
      422,
    )
  })

  it('SHIPPING_OPTION_UNAVAILABLE — express to Rio Branco', async () => {
    const cartId = await guestCartId()
    await addItem(h.app, { productId: 'p-0602' }, { cartId })
    await put(h.app, '/api/cart/cep', { cep: '69900-000' }, { cartId })
    await expectCode(
      await put(h.app, '/api/cart/shipping', { shippingId: 'express' }, { cartId }),
      'SHIPPING_OPTION_UNAVAILABLE',
      422,
    )
  })

  it.each([
    ['4000 0000 0000 0002', 'CARD_DECLINED', 402],
    ['4000 0000 0000 9995', 'INSUFFICIENT_FUNDS', 402],
    ['4000 0000 0000 0069', 'CARD_EXPIRED', 402],
    ['4000 0000 0000 0119', 'PAYMENT_PROCESSOR_ERROR', 500],
  ] as const)('%s — %s', async (cardNumber, code, status) => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0104' }, { token })
    await expectCode(
      await post(h.app, '/api/orders', orderPayload({ cardNumber }), { token }),
      code,
      status,
    )
  })

  it.each(['pix', 'boleto'] as const)(
    'PAYMENT_METHOD_UNAVAILABLE — %s with USD',
    async (method) => {
      const token = await seedSession(h.app, 'ana.souza@timbre.test')
      await addItem(h.app, { productId: 'p-0104' }, { token })
      await expectCode(
        await post(h.app, '/api/orders?currency=USD', orderPayload({ method }), { token }),
        'PAYMENT_METHOD_UNAVAILABLE',
        422,
      )
    },
  )

  it('STOCK_CHANGED — stock vanished between cart and order', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0106', quantity: 3 }, { token })
    h.store.productById('p-0106')!.stock = 1
    await expectCode(
      await post(h.app, '/api/orders', orderPayload(), { token }),
      'STOCK_CHANGED',
      409,
    )
  })

  it('INJECTED_FAILURE — armed through POST /api/test/failure', async () => {
    await post(h.app, '/api/test/failure', { route: 'GET /api/products', times: 1, status: 500 })
    await expectCode(await get(h.app, '/api/products'), 'INJECTED_FAILURE', 500)
  })

  it('covers every code in the contract', () => {
    const all = errorCodeSchema.options as readonly ErrorCode[]
    const missing = all.filter((code) => !reached.has(code))
    expect(missing, `códigos sem teste: ${missing.join(', ')}`).toEqual([])
  })
})
