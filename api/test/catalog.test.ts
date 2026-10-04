import type { ProductListResponse, SellerPageResponse, ProductDetail } from '@timbre/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { createHarness, get, type Harness } from './helpers.js'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

const list = async (query: string): Promise<ProductListResponse> => {
  const response = await get(h.app, `/api/products${query}`)
  expect(response.statusCode).toBe(200)
  return response.json() as ProductListResponse
}

describe('GET /api/categories', () => {
  it('returns the six categories with their real product counts', async () => {
    const response = await get(h.app, '/api/categories')
    const body = response.json() as { items: Array<{ slug: string; productCount: number }> }
    expect(body.items.map((item) => item.slug)).toEqual([
      'guitarras',
      'teclados',
      'bateria',
      'estudio',
      'pedais',
      'acessorios',
    ])
    expect(body.items.reduce((sum, item) => sum + item.productCount, 0)).toBe(60)
  })
})

describe('GET /api/products', () => {
  it('paginates with a default page size of 24', async () => {
    const body = await list('')
    expect(body.total).toBe(60)
    expect(body.page).toBe(1)
    expect(body.perPage).toBe(24)
    expect(body.items).toHaveLength(24)
  })

  it('returns identical bytes for two identical requests', async () => {
    const first = await get(h.app, '/api/products?condition=usado&sort=menor-preco&page=2&perPage=5')
    const second = await get(h.app, '/api/products?condition=usado&sort=menor-preco&page=2&perPage=5')
    expect(first.body).toBe(second.body)
  })

  it('breaks ties on id ascending', async () => {
    const body = await list('?sort=menor-preco&perPage=60')
    for (let index = 1; index < body.items.length; index += 1) {
      const previous = body.items[index - 1]!
      const current = body.items[index]!
      expect(previous.price).toBeLessThanOrEqual(current.price)
      if (previous.price === current.price) {
        expect(previous.id.localeCompare(current.id)).toBeLessThan(0)
      }
    }
  })

  it('sorts by price in both directions', async () => {
    const cheapest = await list('?sort=menor-preco')
    expect(cheapest.items[0]!.id).toBe('p-0501')
    const dearest = await list('?sort=maior-preco')
    expect(dearest.items[0]!.id).toBe('p-0202')
  })

  it('sorts by listing date without reading wall time', async () => {
    const body = await list('?sort=mais-recentes&perPage=60')
    const dates = body.items.map((item) => Date.parse(item.listedAt))
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('matches the query accent-insensitively across name, brand and seller', async () => {
    expect((await list('?q=stratocaster')).items.map((item) => item.id)).toContain('p-0101')
    expect((await list('?q=STRATOCASTER')).total).toBe(1)
    expect((await list('?q=audio prime')).total).toBe(11)
    expect((await list('?q=audio')).total).toBeGreaterThanOrEqual(11)
  })

  it('filters by category, condition, brand, seller, price and free shipping', async () => {
    expect((await list('?category=guitarras')).total).toBe(14)
    expect((await list('?condition=novo')).total).toBe(24)
    expect((await list('?condition=novo&condition=usado')).total).toBe(38)
    expect((await list('?brand=Fender')).total).toBe(2)
    expect((await list('?sellerId=s-08')).total).toBe(2)
    expect((await list('?freeShipping=true')).total).toBe(19)
    expect((await list('?minPrice=400000')).total).toBe(16)
    expect((await list('?minPrice=0&maxPrice=20000')).total).toBe(5)
  })

  it('filters to exactly the six sponsored listings', async () => {
    const body = await list('?sponsored=true&perPage=60')
    expect(body.items.map((item) => item.id).sort()).toEqual([
      'p-0101',
      'p-0203',
      'p-0303',
      'p-0401',
      'p-0504',
      'p-0601',
    ])
    expect(body.items.every((item) => item.sponsored)).toBe(true)
  })

  it('filters to listings on sale, meaning listPrice above price', async () => {
    const all = await list('?perPage=60')
    const expected = all.items
      .filter((item) => item.listPrice !== null && item.listPrice > item.price)
      .map((item) => item.id)
    const body = await list('?onSale=true&perPage=60')
    expect(body.total).toBeGreaterThan(0)
    expect(body.items.map((item) => item.id).sort()).toEqual([...expected].sort())
  })

  it('composes sponsored and onSale with other filters and with facets', async () => {
    const body = await list('?onSale=true&condition=novo&perPage=60')
    expect(body.items.every((item) => item.condition === 'novo')).toBe(true)
    expect(body.items.every((item) => item.listPrice !== null && item.listPrice > item.price)).toBe(
      true,
    )
    const novo = body.facets.condition.find((facet) => facet.value === 'novo')
    expect(novo?.count).toBe(body.total)

    const sponsoredGuitars = await list('?sponsored=true&category=guitarras')
    expect(sponsoredGuitars.items.map((item) => item.id)).toEqual(['p-0101'])
  })

  it('rejects a page size above the documented maximum', async () => {
    const response = await get(h.app, '/api/products?perPage=61')
    expect(response.statusCode).toBe(422)
  })

  it('404s on an unknown category slug', async () => {
    const response = await get(h.app, '/api/products?category=trompetes')
    expect(response.statusCode).toBe(404)
  })
})

describe('facets', () => {
  it('counts each facet against the other active filters, not its own', async () => {
    const body = await list('?category=guitarras&brand=Fender&condition=novo')

    expect(body.total).toBe(1)
    expect(body.items[0]!.id).toBe('p-0101')

    const brands = Object.fromEntries(body.facets.brand.map((entry) => [entry.value, entry.count]))
    expect(brands).toMatchObject({ Fender: 1, Squier: 1, Tagima: 1, Epiphone: 1 })
    expect(Object.keys(brands)).toHaveLength(4)

    const conditions = Object.fromEntries(
      body.facets.condition.map((entry) => [entry.value, entry.count]),
    )
    expect(conditions).toEqual({ novo: 1, seminovo: 1, usado: 0 })
  })

  it('keeps price bucket counts consistent with filtering by the same range', async () => {
    const body = await list('')
    for (const bucket of body.facets.price) {
      const query = bucket.max === null ? `?minPrice=${bucket.min}` : `?minPrice=${bucket.min}&maxPrice=${bucket.max}`
      const filtered = await list(query)
      expect(filtered.total, bucket.value).toBe(bucket.count)
    }
  })

  it('always reports all three conditions and all five price buckets', async () => {
    const body = await list('?q=stratocaster')
    expect(body.facets.condition).toHaveLength(3)
    expect(body.facets.price).toHaveLength(5)
  })
})

describe('GET /api/products/:id', () => {
  it('returns the detail with specs, images and variants', async () => {
    const response = await get(h.app, '/api/products/p-0103')
    expect(response.statusCode).toBe(200)
    const body = response.json() as ProductDetail
    expect(body.name).toBe('Squier Classic Vibe Telecaster')
    expect(body.specs.length).toBeGreaterThan(0)
    expect(body.images).toHaveLength(1)
    expect(body.variants).toHaveLength(1)
    expect(body.variants![0]!.options.map((option) => option.stock)).toEqual([4, 0, 2])
    expect(body.stock).toBe(6)
  })

  it('404s on an unknown id', async () => {
    const response = await get(h.app, '/api/products/p-9999')
    expect(response.statusCode).toBe(404)
  })
})

describe('GET /api/sellers/:slug', () => {
  it('returns the seller, its stats and its products', async () => {
    const response = await get(h.app, '/api/sellers/casa-do-som')
    const body = response.json() as SellerPageResponse
    expect(body.seller.tier).toBe('PLATINA')
    expect(body.seller.productCount).toBe(14)
    expect(body.stats.rating).toBe(48)
    expect(body.products.total).toBe(14)
  })

  it('gives Vintage Room a single page of two products', async () => {
    const response = await get(h.app, '/api/sellers/vintage-room')
    const body = response.json() as SellerPageResponse
    expect(body.products.total).toBe(2)
    expect(body.products.total).toBeLessThanOrEqual(body.products.perPage)
  })

  it('404s on an unknown seller', async () => {
    expect((await get(h.app, '/api/sellers/ninguem')).statusCode).toBe(404)
  })
})
