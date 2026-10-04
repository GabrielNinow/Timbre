import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addItem,
  createHarness,
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

describe('no floats anywhere on the wire', () => {
  it('holds across catalog, cart, checkout and order responses', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    await addItem(h.app, { productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue' }, { token })
    await post(h.app, '/api/cart/coupon', { code: 'TIMBRE10' }, { token })
    await put(h.app, '/api/cart/shipping', { shippingId: 'express' }, { token })

    const responses = [
      await get(h.app, '/api/categories'),
      await get(h.app, '/api/products?perPage=60'),
      await get(h.app, '/api/products/p-0103'),
      await get(h.app, '/api/sellers/casa-do-som'),
      await get(h.app, '/api/cart', { token }),
      await post(h.app, '/api/shipping/quote', { cep: '01310-100' }),
      await get(h.app, '/api/orders', { token }),
      await get(h.app, '/api/orders/TMB-100236', { token }),
      await post(h.app, '/api/orders', orderPayload(), { token }),
    ]

    for (const response of responses) {
      expect(findFloats(response.json())).toEqual([])
    }
  })

  it('keeps percentage-based coupon discounts integral', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0602', quantity: 3 }, { token })
    await post(h.app, '/api/cart/coupon', { code: 'TIMBRE10' }, { token })
    const cart = (await get(h.app, '/api/cart', { token })).json()
    expect(findFloats(cart)).toEqual([])
  })
})

describe('english on the wire', () => {
  // Retired by milestone 3.1 (ADR 0001). Listing content may still contain these
  // words inside prose, so only whole string values count.
  const RETIRED = new Set([
    'novo', 'seminovo', 'usado',
    'PRATA', 'OURO', 'PLATINA',
    'relevancia', 'menor-preco', 'maior-preco', 'mais-recentes',
    'padrao', 'expressa', 'cartao', 'desconhecida',
    'aguardando_pagamento', 'pago', 'enviado', 'entregue', 'cancelado',
    'guitarras', 'teclados', 'bateria', 'estudio', 'pedais', 'acessorios',
  ])

  function stringValues(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) for (const item of value) stringValues(item, out)
    else if (value && typeof value === 'object') {
      for (const item of Object.values(value)) stringValues(item, out)
    }
    return out
  }

  it('carries no retired Portuguese value in any response', async () => {
    const token = await seedSession(h.app, 'bruno.lima@timbre.test')
    await addItem(h.app, { productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue' }, { token })
    await put(h.app, '/api/cart/shipping', { shippingId: 'express' }, { token })

    const responses = [
      await get(h.app, '/api/categories'),
      await get(h.app, '/api/products?perPage=60'),
      await get(h.app, '/api/products?perPage=60&page=2'),
      await get(h.app, '/api/products/p-0103'),
      await get(h.app, '/api/sellers/casa-do-som'),
      await get(h.app, '/api/cart', { token }),
      await post(h.app, '/api/shipping/quote', { cep: '01310-100' }),
      await get(h.app, '/api/orders', { token }),
      await post(h.app, '/api/orders', orderPayload(), { token }),
    ]
    const found = responses.flatMap((response) =>
      stringValues(response.json()).filter((value) => RETIRED.has(value)),
    )
    expect(found).toEqual([])
  })

  it('explains every error in English', async () => {
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    const errorsSeen = [
      await get(h.app, '/api/products/p-9999'),
      await get(h.app, '/api/nowhere'),
      await get(h.app, '/api/orders/TMB-100238', { token }),
      await post(h.app, '/api/cart/coupon', { code: 'NAOEXISTE' }, { token }),
      await post(h.app, '/api/shipping/quote', { cep: '00000-000' }),
      await post(h.app, '/api/auth/login', { email: 'ana.souza@timbre.test', password: 'errada' }),
      await post(h.app, '/api/orders', orderPayload(), { token }),
      await post(h.app, '/api/shipping/quote', { cep: '99999-999' }),
      await post(h.app, '/api/orders?currency=USD', orderPayload({ method: 'pix' }), { token }),
      await get(h.app, '/api/products?currency=EUR'),
    ]
    await addItem(h.app, { productId: 'p-0104' }, { token })
    errorsSeen.push(
      await post(h.app, '/api/orders', orderPayload({ cardNumber: '4000 0000 0000 0119' }), { token }),
    )
    for (const response of errorsSeen) {
      const { error } = response.json() as { error: { message: string; fields?: object } }
      const texts = [error.message, ...stringValues(error.fields ?? {})]
      for (const text of texts) expect(text, text).toMatch(/^[\x20-\x7E—]+$/)
    }
  })
})

describe('determinism', () => {
  const roots = [
    fileURLToPath(new URL('../src', import.meta.url)),
    fileURLToPath(new URL('../../packages/contracts/src', import.meta.url)),
    fileURLToPath(new URL('../../packages/fixtures/src', import.meta.url)),
  ]

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) return sourceFiles(full)
      return full.endsWith('.ts') ? [full] : []
    })
  }

  it('never reads wall time or a random source', async () => {
    const offenders: string[] = []
    for (const root of roots) {
      for (const file of sourceFiles(root)) {
        const source = readFileSync(file, 'utf8')
        for (const [pattern, label] of [
          [/Date\.now\s*\(/, 'Date.now()'],
          [/new\s+Date\s*\(\s*\)/, 'new Date()'],
          [/Math\.random\s*\(/, 'Math.random()'],
        ] as const) {
          if (pattern.test(source)) offenders.push(`${file}: ${label}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('repeats byte-identical answers for repeated reads', async () => {
    const urls = [
      '/api/categories',
      '/api/products?q=strymon&sort=relevance',
      '/api/products/p-0103',
      '/api/sellers/vintage-room',
    ]
    for (const url of urls) {
      const first = await get(h.app, url)
      const second = await get(h.app, url)
      expect(second.body, url).toBe(first.body)
    }
  })

  it('produces the same store state after a reset as on boot', async () => {
    const before = (await get(h.app, '/api/products?perPage=60')).body
    const token = await seedSession(h.app, 'ana.souza@timbre.test')
    await addItem(h.app, { productId: 'p-0104' }, { token })
    await post(h.app, '/api/orders', orderPayload(), { token })
    await post(h.app, '/api/test/reset', {})
    expect((await get(h.app, '/api/products?perPage=60')).body).toBe(before)
  })
})
