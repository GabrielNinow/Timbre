import type { Cart, TestResetResponse } from '@timbre/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addItem,
  createHarness,
  errorCodeOf,
  get,
  post,
  seedSession,
  type Harness,
} from './helpers.js'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

describe('POST /api/test/reset', () => {
  it('restores fixture state in under 50ms', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0106', quantity: 3 }, { token })
    h.store.productById('p-0106')!.stock = 0

    const response = await post(h.app, '/api/test/reset', {})
    expect(response.statusCode).toBe(200)
    const body = response.json() as TestResetResponse
    expect(body.ok).toBe(true)
    expect(body.durationMs).toBeLessThan(50)

    expect(h.store.productById('p-0106')!.stock).toBe(9)
    expect(((await get(h.app, '/api/cart', { token })).json() as Cart).lines).toEqual([])
  })

  it('rewinds every sequence, so the next order is TMB-100241 again', async () => {
    h.store.nextOrderNumber()
    await post(h.app, '/api/test/reset', {})
    expect(h.store.nextOrderNumber()).toBe('TMB-100241')
  })

  it('measures well under the budget across repeated resets', async () => {
    const durations: number[] = []
    for (let index = 0; index < 20; index += 1) {
      const response = await post(h.app, '/api/test/reset', {})
      durations.push((response.json() as TestResetResponse).durationMs)
    }
    expect(Math.max(...durations)).toBeLessThan(50)
  })
})

describe('POST /api/test/session', () => {
  it('hands out a fixture token without the login form', async () => {
    const response = await post(h.app, '/api/test/session', { email: 'bruno.lima@timbre.test' })
    expect(response.statusCode).toBe(200)
    expect((response.json() as { token: string }).token).toBe('tok_u-02_bruno')
  })

  it('skips the forced delay that the login route applies', async () => {
    const startedAt = performance.now()
    await post(h.app, '/api/test/session', { email: 'lento@timbre.test' })
    expect(performance.now() - startedAt).toBeLessThan(500)
  })

  it('404s for an e-mail that is not in the fixture', async () => {
    const response = await post(h.app, '/api/test/session', { email: 'ninguem@timbre.test' })
    expect(response.statusCode).toBe(404)
  })
})

describe('POST /api/test/clock', () => {
  it('sets the injected clock for every downstream computation', async () => {
    const response = await post(h.app, '/api/test/clock', { now: '2027-01-01T00:00:00Z' })
    expect(response.statusCode).toBe(200)
    expect(h.store.now).toBe('2027-01-01T00:00:00Z')
  })

  it('rejects a timestamp that is not ISO 8601 UTC', async () => {
    const response = await post(h.app, '/api/test/clock', { now: '01/01/2027' })
    expect(response.statusCode).toBe(422)
  })
})

describe('POST /api/test/failure', () => {
  it('arms exactly N failures on a route and then heals', async () => {
    await post(h.app, '/api/test/failure', { route: 'GET /api/products', times: 2, status: 503 })

    const first = await get(h.app, '/api/products')
    const second = await get(h.app, '/api/products')
    const third = await get(h.app, '/api/products')

    expect(first.statusCode).toBe(503)
    expect(errorCodeOf(first)).toBe('INJECTED_FAILURE')
    expect(second.statusCode).toBe(503)
    expect(third.statusCode).toBe(200)
  })

  it('matches by path prefix and leaves other routes alone', async () => {
    await post(h.app, '/api/test/failure', { route: '/api/cart', times: 1, status: 500 })
    expect((await get(h.app, '/api/products')).statusCode).toBe(200)
    expect((await get(h.app, '/api/cart')).statusCode).toBe(500)
    expect((await get(h.app, '/api/cart')).statusCode).toBe(200)
  })

  it('can arm a specific error code', async () => {
    await post(h.app, '/api/test/failure', {
      route: 'GET /api/products',
      times: 1,
      status: 500,
      code: 'INTERNAL_ERROR',
    })
    expect(errorCodeOf(await get(h.app, '/api/products'))).toBe('INTERNAL_ERROR')
  })

  it('never arms the test-control routes themselves', async () => {
    await post(h.app, '/api/test/failure', { route: '/api', times: 5, status: 500 })
    expect((await post(h.app, '/api/test/reset', {})).statusCode).toBe(200)
  })

  it('is cleared by a reset', async () => {
    await post(h.app, '/api/test/failure', { route: 'GET /api/products', times: 5, status: 500 })
    await post(h.app, '/api/test/reset', {})
    expect((await get(h.app, '/api/products')).statusCode).toBe(200)
  })
})

describe('without TIMBRE_TEST_MODE', () => {
  it('does not mount any test-control route', async () => {
    const production = await createHarness({ testMode: false })
    for (const route of ['/api/test/reset', '/api/test/session', '/api/test/clock', '/api/test/failure']) {
      const response = await post(production.app, route, {})
      expect(response.statusCode, route).toBe(404)
      expect(errorCodeOf(response)).toBe('NOT_FOUND')
    }
    expect((await get(production.app, '/api/products')).statusCode).toBe(200)
  })
})
