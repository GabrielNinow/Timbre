import {
  PRICE_BUCKETS,
  type Condition,
  type Facets,
  type Sort,
} from '@timbre/contracts'
import type { Store, StoreProduct } from './store.js'

export interface CatalogFilters {
  q?: string | undefined
  categoryId?: string | undefined
  brands?: string[] | undefined
  conditions?: Condition[] | undefined
  sellerId?: string | undefined
  minPrice?: number | undefined
  maxPrice?: number | undefined
  freeShipping?: boolean | undefined
  sponsored?: boolean | undefined
  onSale?: boolean | undefined
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function stockOf(product: StoreProduct): number {
  if (product.variants) {
    return product.variants
      .flatMap((group) => group.options)
      .reduce((sum, option) => sum + option.stock, 0)
  }
  return product.stock ?? 0
}

const CONDITION_ORDER: Condition[] = ['new', 'like-new', 'used']
const CONDITION_LABEL: Record<Condition, string> = {
  new: 'Novo',
  'like-new': 'Seminovo',
  used: 'Usado',
}

function searchHaystack(store: Store, product: StoreProduct): string {
  const seller = store.sellerById(product.sellerId)
  return normalizeText(`${product.name} ${product.brand} ${seller?.name ?? ''}`)
}

type Dimension = 'brand' | 'condition' | 'price'

export function filterProducts(
  store: Store,
  products: readonly StoreProduct[],
  filters: CatalogFilters,
  skip?: Dimension,
): StoreProduct[] {
  const needle = filters.q ? normalizeText(filters.q) : undefined
  return products.filter((product) => {
    if (needle && !searchHaystack(store, product).includes(needle)) return false
    if (filters.categoryId && product.categoryId !== filters.categoryId) return false
    if (filters.sellerId && product.sellerId !== filters.sellerId) return false
    if (skip !== 'brand' && filters.brands?.length && !filters.brands.includes(product.brand)) {
      return false
    }
    if (
      skip !== 'condition' &&
      filters.conditions?.length &&
      !filters.conditions.includes(product.condition)
    ) {
      return false
    }
    if (skip !== 'price') {
      if (filters.minPrice !== undefined && product.price < filters.minPrice) return false
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false
    }
    if (filters.freeShipping && !product.freeShipping) return false
    if (filters.sponsored && !product.sponsored) return false
    if (filters.onSale && !(product.listPrice !== null && product.listPrice > product.price)) {
      return false
    }
    return true
  })
}

function relevanceScore(store: Store, product: StoreProduct, needle: string): number {
  const name = normalizeText(product.name)
  const brand = normalizeText(product.brand)
  const seller = normalizeText(store.sellerById(product.sellerId)?.name ?? '')
  if (name.startsWith(needle)) return 4
  if (name.includes(needle)) return 3
  if (brand.includes(needle)) return 2
  if (seller.includes(needle)) return 1
  return 0
}

export function sortProducts(
  store: Store,
  products: StoreProduct[],
  sort: Sort,
  q?: string,
): StoreProduct[] {
  const needle = q ? normalizeText(q) : undefined
  const byId = (a: StoreProduct, b: StoreProduct) => a.id.localeCompare(b.id)
  const sorted = [...products]
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price || byId(a, b))
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price || byId(a, b))
    case 'newest':
      return sorted.sort(
        (a, b) => Date.parse(b.listedAt) - Date.parse(a.listedAt) || byId(a, b),
      )
    case 'relevance':
    default:
      return sorted.sort((a, b) => {
        if (needle) {
          const diff = relevanceScore(store, b, needle) - relevanceScore(store, a, needle)
          if (diff !== 0) return diff
        }
        return b.rating - a.rating || b.reviewCount - a.reviewCount || byId(a, b)
      })
  }
}

export function computeFacets(
  store: Store,
  base: readonly StoreProduct[],
  filters: CatalogFilters,
): Facets {
  const brandPool = filterProducts(store, base, filters, 'brand')
  const brandCounts = new Map<string, number>()
  for (const product of brandPool) {
    brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1)
  }

  const conditionPool = filterProducts(store, base, filters, 'condition')
  const conditionCounts = new Map<Condition, number>()
  for (const product of conditionPool) {
    conditionCounts.set(product.condition, (conditionCounts.get(product.condition) ?? 0) + 1)
  }

  const pricePool = filterProducts(store, base, filters, 'price')

  return {
    brand: [...brandCounts.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'pt-BR')),
    condition: CONDITION_ORDER.map((value) => ({
      value,
      label: CONDITION_LABEL[value],
      count: conditionCounts.get(value) ?? 0,
    })),
    price: PRICE_BUCKETS.map((bucket) => ({
      value: bucket.value,
      label: bucket.label,
      min: bucket.min,
      max: bucket.max,
      count: pricePool.filter(
        (product) =>
          product.price >= bucket.min && (bucket.max === null || product.price <= bucket.max),
      ).length,
    })),
  }
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}
