import type { ProductSummary } from '@timbre/contracts'
import type { RouteLocationRaw } from 'vue-router'
import type { ListingQuery } from '@/lib/listing'

/** `/p/:slug--:id` — the double dash separates slug from id. */
export function productPath(product: Pick<ProductSummary, 'slug' | 'id'>): string {
  return `/p/${product.slug}--${product.id}`
}

export function categoryRoute(slug: string, query: ListingQuery = {}): RouteLocationRaw {
  return { name: 'category', params: { categorySlug: slug }, query }
}

export function searchRoute(query: ListingQuery = {}): RouteLocationRaw {
  return { name: 'search', query }
}

export function sellerPath(slug: string): string {
  return `/s/${slug}`
}
