import type { Order, OrderListResponse } from '@timbre/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { createHarness, errorCodeOf, get, seedSession, type Harness } from './helpers.js'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

describe('GET /api/orders', () => {
  it('lists only the orders that belong to the caller, newest first', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    const body = (await get(h.app, '/api/orders', { token })).json() as OrderListResponse
    expect(body.total).toBe(3)
    expect(body.items.map((order) => order.number)).toEqual([
      'TMB-100240',
      'TMB-100239',
      'TMB-100236',
    ])
    expect(body.items.map((order) => order.status)).toEqual([
      'aguardando_pagamento',
      'enviado',
      'entregue',
    ])
  })

  it('is empty for the clean account', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    const body = (await get(h.app, '/api/orders', { token })).json() as OrderListResponse
    expect(body.items).toEqual([])
    expect(body.total).toBe(0)
  })

  it('401s without a session', async () => {
    expect((await get(h.app, '/api/orders')).statusCode).toBe(401)
  })
})

describe('GET /api/orders/:id', () => {
  it('returns an order the caller owns', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    const response = await get(h.app, '/api/orders/TMB-100236', { token })
    expect(response.statusCode).toBe(200)
    const order = response.json() as Order
    expect(order.items).toHaveLength(2)
    expect(order.totals.subtotal).toBe(8990 * 2 + 24900)
  })

  it('403s on a real order that belongs to somebody else', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    const response = await get(h.app, '/api/orders/TMB-100238', { token })
    expect(response.statusCode).toBe(403)
    expect(errorCodeOf(response)).toBe('FORBIDDEN')
  })

  it('404s on an order number that does not exist', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    const response = await get(h.app, '/api/orders/TMB-999999', { token })
    expect(response.statusCode).toBe(404)
    expect(errorCodeOf(response)).toBe('NOT_FOUND')
  })

  it('401s without a session even for an order that exists', async () => {
    expect((await get(h.app, '/api/orders/TMB-100236')).statusCode).toBe(401)
  })
})
