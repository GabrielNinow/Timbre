import { PRICE_BUCKETS, productDetailSchema, productSummarySchema } from '@timbre/contracts'
import { categories, products, sellers, users, orders, FIRST_ORDER_NUMBER } from '@timbre/fixtures'
import { describe, expect, it } from 'vitest'

describe('seed integrity', () => {
  it('has 60 products distributed across the six categories', () => {
    expect(products).toHaveLength(60)
    const perCategory = Object.fromEntries(
      categories.map((category) => [
        category.slug,
        products.filter((product) => product.categoryId === category.id).length,
      ]),
    )
    expect(perCategory).toEqual({
      guitars: 14,
      keyboards: 10,
      drums: 8,
      studio: 10,
      pedals: 9,
      accessories: 9,
    })
  })

  it('matches the documented condition split', () => {
    const count = (condition: string) =>
      products.filter((product) => product.condition === condition).length
    expect(count('new')).toBe(24)
    expect(count('like-new')).toBe(22)
    expect(count('used')).toBe(14)
  })

  it('flags 19 products as free shipping and 21 with a list price', () => {
    expect(products.filter((product) => product.freeShipping)).toHaveLength(19)
    expect(products.filter((product) => product.listPrice !== null)).toHaveLength(21)
    for (const product of products) {
      if (product.listPrice !== null) expect(product.listPrice).toBeGreaterThan(product.price)
    }
  })

  it('gives every seller its documented product count', () => {
    const perSeller = Object.fromEntries(
      sellers.map((seller) => [
        seller.id,
        products.filter((product) => product.sellerId === seller.id).length,
      ]),
    )
    expect(perSeller).toEqual({
      's-01': 14,
      's-02': 11,
      's-03': 10,
      's-04': 8,
      's-05': 7,
      's-06': 5,
      's-07': 3,
      's-08': 2,
    })
  })

  it('puts at least four products in every filter price bucket', () => {
    for (const bucket of PRICE_BUCKETS) {
      const inBucket = products.filter(
        (product) =>
          product.price >= bucket.min && (bucket.max === null || product.price <= bucket.max),
      )
      expect(inBucket.length, `bucket ${bucket.value}`).toBeGreaterThanOrEqual(4)
    }
  })

  it('never sits a price exactly on a bucket boundary', () => {
    const boundaries = new Set(PRICE_BUCKETS.flatMap((bucket) => [bucket.min, bucket.max ?? -1]))
    boundaries.delete(0)
    boundaries.delete(-1)
    for (const product of products) {
      expect(boundaries.has(product.price), `${product.id} em ${product.price}`).toBe(false)
    }
  })

  it('spans R$ 39,90 to R$ 8.990,00', () => {
    const prices = products.map((product) => product.price)
    expect(Math.min(...prices)).toBe(3990)
    expect(Math.max(...prices)).toBe(899000)
    expect(products.find((product) => product.price === 3990)?.id).toBe('p-0501')
    expect(products.find((product) => product.price === 899000)?.id).toBe('p-0202')
  })

  it('keeps every anchor product exactly as the spec describes them', () => {
    const byId = (id: string) => products.find((product) => product.id === id)!

    expect(byId('p-0101').stock).toBe(1)
    expect(byId('p-0102').stock).toBe(0)

    const variants = byId('p-0103').variants!
    expect(variants).toHaveLength(1)
    expect(variants[0]!.label).toBe('Cor')
    expect(variants[0]!.options.map((option) => [option.name, option.stock, option.priceDelta])).toEqual([
      ['Butterscotch Blonde', 4, 0],
      ['Black', 0, 0],
      ['Sonic Blue', 2, 15000],
    ])
    expect(byId('p-0103').stock).toBeNull()

    expect(byId('p-0104').price).toBe(129900)
    expect(byId('p-0104').listPrice).toBe(169900)
    expect(Math.round((1 - 129900 / 169900) * 100)).toBe(24)

    expect(byId('p-0201').stock).toBe(3)
    expect(byId('p-0202').price).toBe(899000)
    expect(byId('p-0301').freeShipping).toBe(false)
    expect(byId('p-0401').condition).toBe('new')
    expect(byId('p-0501').price).toBe(3990)
    expect(byId('p-0601').freeShipping).toBe(true)
    expect(byId('p-0601').price).toBeLessThan(30000)
    expect(byId('p-0602').reviewCount).toBe(0)
    expect(byId('p-0602').rating).toBe(0)

    const bigsky = products.filter((product) => product.name === 'Strymon BigSky')
    expect(bigsky).toHaveLength(2)
    expect(new Set(bigsky.map((product) => product.sellerId)).size).toBe(2)
    expect(new Set(bigsky.map((product) => product.price)).size).toBe(2)
    expect(new Set(bigsky.map((product) => product.condition)).size).toBe(2)
  })

  it('is the cheapest guitar at p-0104', () => {
    const guitars = products.filter((product) => product.categoryId === 'c-01')
    expect(Math.min(...guitars.map((product) => product.price))).toBe(129900)
    expect(guitars.find((product) => product.price === 129900)?.id).toBe('p-0104')
  })

  it('gives every product a unique id and a unique listing date', () => {
    expect(new Set(products.map((product) => product.id)).size).toBe(60)
    expect(new Set(products.map((product) => product.listedAt)).size).toBe(60)
  })

  it('serialises every product through the wire contract', () => {
    for (const product of products) {
      const summary = productSummarySchema.safeParse({
        ...product,
        stock: product.stock ?? 6,
        seller: { id: 's-01', name: 'Casa do Som', slug: 'casa-do-som', tier: 'PLATINUM', state: 'SP' },
      })
      expect(summary.success, `${product.id}: ${summary.error?.message}`).toBe(true)
      expect(productDetailSchema.shape.description.safeParse(product.description).success).toBe(true)
    }
  })

  it('reserves TMB-100236 … TMB-100240 and hands the next order to TMB-100241', () => {
    expect(orders.map((order) => order.number)).toEqual([
      'TMB-100236',
      'TMB-100237',
      'TMB-100238',
      'TMB-100239',
      'TMB-100240',
    ])
    expect(FIRST_ORDER_NUMBER).toBe(100241)

    const bruno = orders.filter((order) => order.userId === 'u-02')
    expect(bruno).toHaveLength(3)
    expect(new Set(bruno.map((order) => order.status))).toEqual(
      new Set(['awaiting_payment', 'shipped', 'delivered']),
    )

    const forbidden = orders.find((order) => order.number === 'TMB-100238')!
    expect(forbidden.userId).toBe('u-05')
    expect(users.find((user) => user.id === 'u-05')?.hidden).toBe(true)
  })

  it('keeps the four documented accounts intact', () => {
    const byEmail = (email: string) => users.find((user) => user.email === email)!
    expect(byEmail('ana.souza@timbre.test').password).toBe('Teste@1234')
    expect(byEmail('bruno.lima@timbre.test').addresses).toHaveLength(2)
    expect(byEmail('bloqueado@timbre.test').locked).toBe(true)
    expect(byEmail('lento@timbre.test').loginDelayMs).toBe(3000)
  })
})

describe('listing content stays as sellers wrote it', () => {
  it('never leaks an English condition code into a spec value', () => {
    const leaks = products.flatMap((product) =>
      product.specs.filter((spec) => /^(new|like-new|used)$/i.test(spec.value)).map((spec) => `${product.id} ${spec.label}=${spec.value}`),
    )
    expect(leaks).toEqual([])
  })
})


describe('product photos', () => {
  it('credits every photo, under a free licence, and ships the file', async () => {
    const { photoCredits } = await import('@timbre/fixtures/photo-credits')
    const { existsSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    for (const product of products) {
      const credit = photoCredits[product.id]
      if (!credit) {
        expect(product.imageUrl, product.id).toBe(`/img/products/${product.id}.svg`)
        continue
      }
      expect(product.imageUrl, product.id).toBe(`/img/photos/${product.id}.webp`)
      expect(credit.license, product.id).toMatch(/^(cc0|public domain|cc by(-sa)? \d)/i)
      expect(credit.author.length, product.id).toBeGreaterThan(0)
      expect(credit.source, product.id).toMatch(/^https:\/\/commons\.wikimedia\.org\//)
      const file = fileURLToPath(new URL(`../../app/public${product.imageUrl}`, import.meta.url))
      expect(existsSync(file), file).toBe(true)
    }
  })
})
