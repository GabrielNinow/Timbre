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
    await put(h.app, '/api/cart/shipping', { shippingId: 'expressa' }, { token })

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
      '/api/products?q=strymon&sort=relevancia',
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
