import {
  BRL_PER_USD,
  categoryListSchema,
  exchangeRateResponseSchema,
  productDetailSchema,
  productListQuerySchema,
  productListResponseSchema,
  sellerPageResponseSchema,
} from '@timbre/contracts'
import type { FastifyInstance } from 'fastify'
import {
  computeFacets,
  filterProducts,
  paginate,
  sortProducts,
  type CatalogFilters,
} from '../catalog.js'
import { requestCurrency } from '../currency.js'
import { errors } from '../errors.js'
import { toProductDetail, toProductSummary } from '../mappers.js'
import type { Store } from '../store.js'
import { parseQuery, send } from '../validate.js'

export function registerCatalogRoutes(app: FastifyInstance, store: Store): void {
  app.get('/api/categories', async (_request, reply) => {
    const items = store.categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      productCount: store.products.filter((product) => product.categoryId === category.id).length,
    }))
    return send(reply, categoryListSchema, { items })
  })

  app.get('/api/exchange-rate', async (_request, reply) =>
    send(reply, exchangeRateResponseSchema, { base: 'USD', quote: 'BRL', rate: BRL_PER_USD }),
  )

  app.get('/api/products', async (request, reply) => {
    const query = parseQuery(productListQuerySchema, request.query)
    const category = query.category ? store.categoryBySlug(query.category) : undefined
    if (query.category && !category) throw errors.notFound('Category not found.')

    const filters: CatalogFilters = {
      q: query.q,
      categoryId: category?.id,
      brands: query.brand,
      conditions: query.condition,
      sellerId: query.sellerId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      freeShipping: query.freeShipping,
      sponsored: query.sponsored,
      onSale: query.onSale,
      currency: query.currency,
    }

    const matched = filterProducts(store, store.products, filters)
    const ordered = sortProducts(store, matched, query.sort, query.q)
    const items = paginate(ordered, query.page, query.perPage).map((product) =>
      toProductSummary(store, product, query.currency),
    )

    return send(reply, productListResponseSchema, {
      currency: query.currency,
      items,
      page: query.page,
      perPage: query.perPage,
      total: matched.length,
      facets: computeFacets(store, store.products, filters),
    })
  })

  app.get<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
    const product = store.productById(request.params.id)
    if (!product) throw errors.notFound('Product not found.')
    return send(reply, productDetailSchema, toProductDetail(store, product, requestCurrency(request)))
  })

  app.get<{ Params: { slug: string } }>('/api/sellers/:slug', async (request, reply) => {
    const seller = store.sellerBySlug(request.params.slug)
    if (!seller) throw errors.notFound('Seller not found.')
    const query = parseQuery(productListQuerySchema, request.query)

    const filters: CatalogFilters = {
      q: query.q,
      categoryId: query.category ? store.categoryBySlug(query.category)?.id : undefined,
      brands: query.brand,
      conditions: query.condition,
      sellerId: seller.id,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      freeShipping: query.freeShipping,
      sponsored: query.sponsored,
      onSale: query.onSale,
      currency: query.currency,
    }
    const matched = filterProducts(store, store.products, filters)
    const ordered = sortProducts(store, matched, query.sort, query.q)

    return send(reply, sellerPageResponseSchema, {
      currency: query.currency,
      seller: {
        id: seller.id,
        name: seller.name,
        slug: seller.slug,
        tier: seller.tier,
        state: seller.state,
        bio: seller.bio,
        productCount: store.products.filter((product) => product.sellerId === seller.id).length,
      },
      stats: {
        rating: seller.rating,
        salesCount: seller.salesCount,
        onTimeRate: seller.onTimeRate,
        memberSince: seller.memberSince,
      },
      products: {
        items: paginate(ordered, query.page, query.perPage).map((product) =>
          toProductSummary(store, product, query.currency),
        ),
        page: query.page,
        perPage: query.perPage,
        total: matched.length,
      },
    })
  })
}
