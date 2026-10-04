import type { ProductSummary } from '@timbre/contracts'
import type { RouteLocationRaw } from 'vue-router'
import { languageParam, localizePath, type PageLanguage } from '@/lib/language'
import type { ListingQuery } from '@/lib/listing'

/** Every helper takes the Page language, so no link ever drops the `/en` prefix. */

export function homePath(language: PageLanguage): string {
  return localizePath('/', language)
}

/** `/p/:slug--:id` — the double dash separates slug from id. */
export function productPath(product: Pick<ProductSummary, 'slug' | 'id'>, language: PageLanguage): string {
  return localizePath(`/p/${product.slug}--${product.id}`, language)
}

export function categoryRoute(slug: string, language: PageLanguage, query: ListingQuery = {}): RouteLocationRaw {
  return { name: 'category', params: { categorySlug: slug, locale: languageParam(language) }, query }
}

export function searchRoute(language: PageLanguage, query: ListingQuery = {}): RouteLocationRaw {
  return { name: 'search', params: { locale: languageParam(language) }, query }
}

export function sellerPath(slug: string, language: PageLanguage): string {
  return localizePath(`/s/${slug}`, language)
}
