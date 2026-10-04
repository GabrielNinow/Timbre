import {
  conditionSchema,
  sortSchema,
  type Condition,
  type ProductListQuery,
  type Sort,
} from '@timbre/contracts'
import { BRL_PER_USD } from '@timbre/contracts'
import {
  DEFAULT_LANGUAGE,
  currencyFor,
  languageOfPath,
  localizePath,
  type PageCurrency,
  type PageLanguage,
} from '@/lib/language'

/**
 * The one place that knows how a listing view maps to its URL and to the API.
 * Pages and components never read or build listing query strings themselves.
 */

export const LISTING_PER_PAGE = 24
const Q_MAX_LENGTH = 120
const CONDITION_ORDER: readonly Condition[] = conditionSchema.options
const DEFAULT_SORT: Sort = 'relevance'

export interface PriceRange {
  /** Inclusive, integer centavos. */
  min: number
  /** Inclusive, integer centavos. `null` means no ceiling. */
  max: number | null
}

export interface ListingState {
  q: string | null
  category: string | null
  brands: string[]
  conditions: Condition[]
  price: PriceRange | null
  freeShipping: boolean
  sort: Sort
  page: number
}

export interface ListingContext {
  /** Set on `/c/:categorySlug`: the category is part of the path, not a filter. */
  pinnedCategory?: string
  /** Set on `/s/:sellerSlug`: only this seller's listings, never a removable filter. */
  pinnedSellerId?: string
}

/** Route query as Vue Router hands it over. */
export type RawQuery = Record<string, string | null | (string | null)[] | undefined>
export type ListingQuery = Record<string, string | string[]>

export type ListingFilter =
  | { facet: 'category'; value: string }
  | { facet: 'brand'; value: string }
  | { facet: 'condition'; value: Condition }
  | { facet: 'price'; value: PriceRange }
  | { facet: 'freeShipping' }

export type ListingFilterFacet = ListingFilter['facet']

function all(raw: RawQuery, key: string): string[] {
  const value = raw[key]
  if (value === undefined || value === null) return []
  const list = Array.isArray(value) ? value : [value]
  return list.filter((item): item is string => typeof item === 'string')
}

function first(raw: RawQuery, key: string): string | undefined {
  return all(raw, key)[0]
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CENTAVOS = /^\d{1,9}$/

export function parsePrice(raw: string | undefined): PriceRange | null {
  if (raw === undefined) return null
  const open = /^(\d{1,9})\+$/.exec(raw)
  if (open) return { min: Number(open[1]), max: null }
  const [minText, maxText, ...rest] = raw.split('-')
  if (rest.length > 0 || minText === undefined || maxText === undefined) return null
  if (!CENTAVOS.test(minText) || !CENTAVOS.test(maxText)) return null
  const min = Number(minText)
  const max = Number(maxText)
  return min <= max ? { min, max } : null
}

export function formatPriceParam(range: PriceRange): string {
  return range.max === null ? `${range.min}+` : `${range.min}-${range.max}`
}

function canonicalBrands(brands: readonly string[]): string[] {
  return [...new Set(brands.map((brand) => brand.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

function canonicalConditions(conditions: readonly Condition[]): Condition[] {
  return CONDITION_ORDER.filter((condition) => conditions.includes(condition))
}

export function emptyListing(context: ListingContext = {}): ListingState {
  return {
    q: null,
    category: context.pinnedCategory ?? null,
    brands: [],
    conditions: [],
    price: null,
    freeShipping: false,
    sort: DEFAULT_SORT,
    page: 1,
  }
}

/** Never throws: unknown or malformed values are dropped, so any URL renders. */
export function parseListing(raw: RawQuery, context: ListingContext = {}): ListingState {
  const q = first(raw, 'q')?.trim().slice(0, Q_MAX_LENGTH) ?? ''
  const category = first(raw, 'category')
  const sort = sortSchema.safeParse(first(raw, 'sort'))
  const page = Number(first(raw, 'page'))
  const conditions = all(raw, 'condition').filter(
    (value): value is Condition => conditionSchema.safeParse(value).success,
  )

  return {
    q: q.length > 0 ? q : null,
    category:
      context.pinnedCategory ?? (category !== undefined && SLUG.test(category) ? category : null),
    brands: canonicalBrands(all(raw, 'brand')),
    conditions: canonicalConditions(conditions),
    price: parsePrice(first(raw, 'price')),
    freeShipping: first(raw, 'freeShipping') === 'true',
    sort: sort.success ? sort.data : DEFAULT_SORT,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/** Canonical: defaults omitted, repeatable values in stable order. */
export function serializeListing(state: ListingState, context: ListingContext = {}): ListingQuery {
  const query: ListingQuery = {}
  if (state.q !== null) query.q = state.q
  if (state.category !== null && context.pinnedCategory === undefined) {
    query.category = state.category
  }
  const brands = canonicalBrands(state.brands)
  if (brands.length > 0) query.brand = brands
  const conditions = canonicalConditions(state.conditions)
  if (conditions.length > 0) query.condition = conditions
  if (state.price !== null) query.price = formatPriceParam(state.price)
  if (state.freeShipping) query.freeShipping = 'true'
  if (state.sort !== DEFAULT_SORT) query.sort = state.sort
  if (state.page > 1) query.page = String(state.page)
  return query
}

type ApiKey = keyof ProductListQuery

/** The `GET /api/products` query for this state, already validated by the contract. */
export function toApiParams(
  state: ListingState,
  perPage = LISTING_PER_PAGE,
  currency: 'BRL' | 'USD' = 'BRL',
  context: ListingContext = {},
): URLSearchParams {
  const params = new URLSearchParams()
  const set = (key: ApiKey, value: string) => params.append(key, value)
  if (state.q !== null) set('q', state.q)
  if (state.category !== null) set('category', state.category)
  if (context.pinnedSellerId !== undefined) set('sellerId', context.pinnedSellerId)
  for (const brand of canonicalBrands(state.brands)) set('brand', brand)
  for (const condition of canonicalConditions(state.conditions)) set('condition', condition)
  if (state.price !== null) {
    set('minPrice', String(state.price.min))
    if (state.price.max !== null) set('maxPrice', String(state.price.max))
  }
  if (state.freeShipping) set('freeShipping', 'true')
  set('sort', state.sort)
  set('page', String(state.page))
  set('perPage', String(perPage))
  if (currency !== 'BRL') set('currency', currency)
  return params
}

/** Every change except paging sends the Visitor back to page 1. */
export function updateListing(
  state: ListingState,
  patch: Partial<Omit<ListingState, 'page'>>,
): ListingState {
  return { ...state, ...patch, page: 1 }
}

export function goToPage(state: ListingState, page: number): ListingState {
  return { ...state, page: Math.max(1, Math.trunc(page)) }
}

export function toggleBrand(state: ListingState, brand: string): ListingState {
  const brands = state.brands.includes(brand)
    ? state.brands.filter((item) => item !== brand)
    : [...state.brands, brand]
  return updateListing(state, { brands: canonicalBrands(brands) })
}

export function toggleCondition(state: ListingState, condition: Condition): ListingState {
  const conditions = state.conditions.includes(condition)
    ? state.conditions.filter((item) => item !== condition)
    : [...state.conditions, condition]
  return updateListing(state, { conditions: canonicalConditions(conditions) })
}

/** The removable chips, in rail order. A pinned category is never one of them. */
export function activeFilters(state: ListingState, context: ListingContext = {}): ListingFilter[] {
  const filters: ListingFilter[] = []
  if (state.category !== null && context.pinnedCategory === undefined) {
    filters.push({ facet: 'category', value: state.category })
  }
  for (const value of canonicalBrands(state.brands)) filters.push({ facet: 'brand', value })
  for (const value of canonicalConditions(state.conditions)) {
    filters.push({ facet: 'condition', value })
  }
  if (state.price !== null) filters.push({ facet: 'price', value: state.price })
  if (state.freeShipping) filters.push({ facet: 'freeShipping' })
  return filters
}

export function filterKey(filter: ListingFilter): string {
  switch (filter.facet) {
    case 'freeShipping':
      return 'freeShipping'
    case 'price':
      return `price:${formatPriceParam(filter.value)}`
    default:
      return `${filter.facet}:${filter.value}`
  }
}

export function removeFilter(state: ListingState, filter: ListingFilter): ListingState {
  switch (filter.facet) {
    case 'category':
      return updateListing(state, { category: null })
    case 'brand':
      return updateListing(state, { brands: state.brands.filter((item) => item !== filter.value) })
    case 'condition':
      return updateListing(state, {
        conditions: state.conditions.filter((item) => item !== filter.value),
      })
    case 'price':
      return updateListing(state, { price: null })
    case 'freeShipping':
      return updateListing(state, { freeShipping: false })
  }
}

/** "Limpar tudo": drops every filter, keeps the search text, the sort and a pinned category. */
export function clearFilters(state: ListingState, context: ListingContext = {}): ListingState {
  return {
    ...emptyListing(context),
    q: state.q,
    sort: state.sort,
  }
}

export type PriceInputResult =
  | { ok: true; range: PriceRange | null }
  | { ok: false; reason: 'invalid' | 'min-above-max' }

/** Separators follow the Page language: `1.299,90` in Portuguese, `1,299.90` in English. */
function reaisToCentavos(text: string, language: PageLanguage): number | null | 'invalid' {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const [group, decimal] = language === 'en' ? [',', '.'] : ['.', ',']
  const bare = trimmed.split(group).join('')
  const [whole, cents, ...rest] = bare.split(decimal)
  if (rest.length > 0 || whole === undefined || !/^\d{1,7}$/.test(whole)) return 'invalid'
  if (cents !== undefined && !/^\d{1,2}$/.test(cents)) return 'invalid'
  return Number(whole) * 100 + Number((cents ?? '').padEnd(2, '0'))
}

/** Validates the typed min/max pair, entered in reais. Invalid input fires no request. */
export function priceFromInputs(
  minText: string,
  maxText: string,
  language: PageLanguage = DEFAULT_LANGUAGE,
): PriceInputResult {
  const min = reaisToCentavos(minText, language)
  const max = reaisToCentavos(maxText, language)
  if (min === 'invalid' || max === 'invalid') return { ok: false, reason: 'invalid' }
  if (min === null && max === null) return { ok: true, range: null }
  if (min !== null && max !== null && min > max) return { ok: false, reason: 'min-above-max' }
  return { ok: true, range: { min: min ?? 0, max } }
}

/** The inverse of `priceFromInputs`, to prefill the inputs from the URL. */
export function priceToInput(centavos: number | null, language: PageLanguage = DEFAULT_LANGUAGE): string {
  if (centavos === null) return ''
  const cents = centavos % 100
  const whole = String(Math.trunc(centavos / 100))
  return cents === 0 ? whole : `${whole}${language === 'en' ? '.' : ','}${String(cents).padStart(2, '0')}`
}

export function samePrice(a: PriceRange | null, b: PriceRange | null): boolean {
  return a?.min === b?.min && a?.max === b?.max
}

/** Converts cents between currencies by the Demo exchange rate, half-up, as the API does. */
function convertCents(cents: number, from: PageCurrency, to: PageCurrency): number {
  if (from === to) return cents
  return to === 'BRL' ? cents * BRL_PER_USD : Math.floor((cents * 2 + BRL_PER_USD) / (BRL_PER_USD * 2))
}

export function convertPriceRange(range: PriceRange, from: PageCurrency, to: PageCurrency): PriceRange {
  return {
    min: convertCents(range.min, from, to),
    max: range.max === null ? null : convertCents(range.max, from, to),
  }
}

/**
 * The same page in another Page language. The `price` filter is in the page's
 * Currency, so it converts with the language: R$ 200 a R$ 500 becomes $40 to $100.
 */
export function switchLanguagePath(fullPath: string, language: PageLanguage): string {
  const target = localizePath(fullPath, language)
  const from = currencyFor(languageOfPath(fullPath))
  const to = currencyFor(language)
  const queryStart = target.indexOf('?')
  if (from === to || queryStart === -1) return target
  const hashStart = target.indexOf('#', queryStart)
  const path = target.slice(0, queryStart)
  const hash = hashStart === -1 ? '' : target.slice(hashStart)
  const params = new URLSearchParams(target.slice(queryStart + 1, hashStart === -1 ? undefined : hashStart))
  const price = parsePrice(params.get('price') ?? undefined)
  if (price === null) return target
  params.set('price', formatPriceParam(convertPriceRange(price, from, to)))
  return `${path}?${params.toString()}${hash}`
}

