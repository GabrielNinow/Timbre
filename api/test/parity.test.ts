import { describe, expect, it } from 'vitest'
import { createApi, type Method } from '../src/core.js'
import { Store } from '../src/store.js'
import { createHarness, orderPayload } from './helpers.js'

/**
 * The public demo calls the framework-free core in the browser; development, the
 * suites and CI go through Fastify (ADR 0004). The same requests, through both,
 * must give the same status and the same body.
 */
type Step = { method: Method; url: string; body?: unknown; headers?: Record<string, string> }

const JOURNEY: Step[] = [
  { method: 'GET', url: '/api/categories' },
  { method: 'GET', url: '/api/products?condition=new&condition=used&sort=price-asc&page=2&perPage=5' },
  { method: 'GET', url: '/api/products?q=strymon&currency=USD' },
  { method: 'GET', url: '/api/products/p-0103?currency=USD' },
  { method: 'GET', url: '/api/products/p-9999' },
  { method: 'GET', url: '/api/sellers/vintage-room' },
  { method: 'GET', url: '/api/products?perPage=61' },
  { method: 'GET', url: '/api/products?currency=EUR' },
  { method: 'POST', url: '/api/products/p-0102/notify', body: { email: 'a@b.co' } },
  { method: 'POST', url: '/api/shipping/quote?currency=USD', body: { cep: '69900-000' } },
  { method: 'POST', url: '/api/shipping/quote', body: { cep: '00000-000' } },
  { method: 'POST', url: '/api/auth/login', body: { email: 'bloqueado@timbre.test', password: 'Teste@1234' } },
  { method: 'POST', url: '/api/auth/login', body: { email: 'ana.souza@timbre.test', password: 'errada' } },
  { method: 'GET', url: '/api/cart', headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'POST', url: '/api/cart/items', body: { productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue', quantity: 1 }, headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'POST', url: '/api/cart/items', body: { productId: 'p-0101', quantity: 2 }, headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'POST', url: '/api/cart/coupon', body: { code: 'TIMBRE10' }, headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'PUT', url: '/api/cart/shipping?currency=USD', body: { shippingId: 'express' }, headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'POST', url: '/api/orders?currency=USD', body: orderPayload({ method: 'pix' }), headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'POST', url: '/api/orders', body: orderPayload({ cardNumber: '4000 0000 0000 0002' }), headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'POST', url: '/api/orders', body: orderPayload(), headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'GET', url: '/api/orders', headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'GET', url: '/api/orders/TMB-100238', headers: { authorization: 'Bearer tok_u-01_ana' } },
  { method: 'GET', url: '/api/nowhere' },
]

function queryOf(url: string): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of new URLSearchParams(url.split('?')[1] ?? '')) {
    const existing = query[key]
    query[key] = existing === undefined ? value : Array.isArray(existing) ? [...existing, value] : [existing, value]
  }
  return query
}

describe('adapter parity', () => {
  it('answers a whole journey identically through Fastify and the bare core', async () => {
    const fastify = await createHarness()
    const core = createApi(new Store(), { testMode: true })
    for (const step of JOURNEY) {
      const viaFastify = await fastify.app.inject({
        method: step.method,
        url: step.url,
        headers: step.headers,
        ...(step.body !== undefined ? { payload: step.body as object } : {}),
      })
      const viaCore = await core.handle({
        method: step.method,
        url: step.url,
        path: step.url.split('?')[0]!,
        query: queryOf(step.url),
        headers: step.headers ?? {},
        body: step.body === undefined ? undefined : JSON.parse(JSON.stringify(step.body)),
      })
      const label = `${step.method} ${step.url}`
      expect(viaCore.status, label).toBe(viaFastify.statusCode)
      expect(JSON.parse(JSON.stringify(viaCore.body)), label).toEqual(viaFastify.json())
    }
  })
})

describe('store snapshots', () => {
  it('round-trips everything a Visitor can change', async () => {
    const store = new Store()
    const api = createApi(store, { testMode: false })
    const auth = { authorization: 'Bearer tok_u-01_ana' }
    await api.handle({ method: 'POST', url: '/api/cart/items', path: '/api/cart/items', query: {}, headers: auth, body: { productId: 'p-0101', quantity: 1 } })
    await api.handle({ method: 'POST', url: '/api/orders', path: '/api/orders', query: {}, headers: auth, body: orderPayload({ method: 'pix' }) })
    const saved = JSON.parse(JSON.stringify(store.snapshot()))

    const restored = new Store()
    expect(restored.restore(saved)).toBe(true)
    expect(restored.productById('p-0101')!.stock).toBe(0)
    expect(restored.orders.map((order) => order.id)).toContain('TMB-100241')
    // Sequences continue rather than restart.
    const next = createApi(restored, { testMode: false })
    await next.handle({ method: 'POST', url: '/api/cart/items', path: '/api/cart/items', query: {}, headers: auth, body: { productId: 'p-0104', quantity: 1 } })
    const order = await next.handle({ method: 'POST', url: '/api/orders', path: '/api/orders', query: {}, headers: auth, body: orderPayload({ method: 'pix' }) })
    expect((order.body as { id: string }).id).toBe('TMB-100242')
  })

  it('takes listing content from the current fixtures, keeping saved stock', () => {
    const store = new Store()
    const saved = JSON.parse(JSON.stringify(store.snapshot()))
    const old = saved.products.find((product: { id: string }) => product.id === 'p-0404')
    old.imageUrl = '/img/products/p-0404.svg'
    old.images = [old.imageUrl]
    old.stock = 0

    const restored = new Store()
    expect(restored.restore(saved)).toBe(true)
    const product = restored.productById('p-0404')!
    expect(product.imageUrl).toBe(store.productById('p-0404')!.imageUrl)
    expect(product.stock).toBe(0)
  })

  it('drops saved cart lines for products that are no longer listed', () => {
    const store = new Store()
    const saved = JSON.parse(JSON.stringify(store.snapshot()))
    saved.carts = [['c-old', { id: 'c-old', userId: null, cep: '89010-000', couponCode: null, selectedShippingId: 'standard', lines: [
      { id: 'l-1', productId: 'p-0301', variantOptionId: null, quantity: 1 },
      { id: 'l-2', productId: 'p-0101', variantOptionId: null, quantity: 1 },
    ] }]]

    const restored = new Store()
    expect(restored.restore(saved)).toBe(true)
    expect(restored.carts.get('c-old')!.lines.map((line) => line.productId)).toEqual(['p-0101'])
  })

  it('ignores a snapshot of another version or shape', () => {
    const store = new Store()
    expect(store.restore({ version: 999 })).toBe(false)
    expect(store.restore('nonsense')).toBe(false)
    expect(store.restore(null)).toBe(false)
    expect(store.productById('p-0101')!.stock).toBe(1)
  })

  it('has no test-control routes outside test mode', async () => {
    const api = createApi(new Store(), { testMode: false })
    const response = await api.handle({ method: 'POST', url: '/api/test/reset', path: '/api/test/reset', query: {}, headers: {}, body: {} })
    expect(response.status).toBe(404)
  })
})
