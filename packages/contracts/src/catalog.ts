import { z } from 'zod'
import {
  currencySchema,
  centavos,
  centavosDelta,
  conditionSchema,
  idString,
  isoDateTime,
  paginatedSchema,
  percent,
  ratingTenths,
  sellerTierSchema,
  slugString,
  ufSchema,
  type Currency,
} from './primitives.js'

/** Category names are Platform copy, rendered by the client from `slug`. */
export const categorySchema = z.object({
  id: idString,
  slug: slugString,
  productCount: z.number().int().nonnegative(),
})
export type Category = z.infer<typeof categorySchema>

export const categoryListSchema = z.object({ items: z.array(categorySchema) })
export type CategoryList = z.infer<typeof categoryListSchema>

/** The seller as embedded in a product. Untiered individuals carry `tier: null`. */
export const sellerRefSchema = z.object({
  id: idString,
  name: z.string().min(1),
  slug: slugString,
  tier: sellerTierSchema.nullable(),
  state: ufSchema,
})
export type SellerRef = z.infer<typeof sellerRefSchema>

export const sellerStatsSchema = z.object({
  rating: ratingTenths,
  salesCount: z.number().int().nonnegative(),
  onTimeRate: percent,
  memberSince: isoDateTime,
})
export type SellerStats = z.infer<typeof sellerStatsSchema>

export const sellerSchema = sellerRefSchema.extend({
  bio: z.string(),
  productCount: z.number().int().nonnegative(),
})
export type Seller = z.infer<typeof sellerSchema>

export const variantOptionSchema = z.object({
  id: idString,
  name: z.string().min(1),
  priceDelta: centavosDelta,
  stock: z.number().int().nonnegative(),
})
export type VariantOption = z.infer<typeof variantOptionSchema>

export const variantGroupSchema = z.object({
  label: z.string().min(1),
  options: z.array(variantOptionSchema).min(1),
})
export type VariantGroup = z.infer<typeof variantGroupSchema>

export const productSummarySchema = z.object({
  id: idString,
  slug: slugString,
  name: z.string().min(1),
  brand: z.string().min(1),
  categoryId: idString,
  price: centavos,
  listPrice: centavos.nullable(),
  condition: conditionSchema,
  year: z.number().int().min(1900).max(2100).nullable(),
  stock: z.number().int().nonnegative(),
  freeShipping: z.boolean(),
  imageUrl: z.string().min(1),
  rating: ratingTenths,
  reviewCount: z.number().int().nonnegative(),
  listedAt: isoDateTime,
  sponsored: z.boolean(),
  seller: sellerRefSchema,
})
export type ProductSummary = z.infer<typeof productSummarySchema>

export const productSpecSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})
export type ProductSpec = z.infer<typeof productSpecSchema>

export const productDetailSchema = productSummarySchema.extend({
  currency: currencySchema,
  description: z.string().min(1),
  images: z.array(z.string().min(1)).min(1),
  specs: z.array(productSpecSchema),
  /** Present only for products sold by variant. Stock is then per option. */
  variants: z.array(variantGroupSchema).optional(),
})
export type ProductDetail = z.infer<typeof productDetailSchema>

export const sortSchema = z.enum(['relevance', 'price-asc', 'price-desc', 'newest'])
export type Sort = z.infer<typeof sortSchema>

const repeatable = <T extends z.ZodType>(item: T) =>
  z.preprocess(
    (value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
    z.array(item).optional(),
  )

const trueFlag = z.preprocess(
  (value) => (value === undefined ? undefined : value === 'true' || value === true),
  z.boolean().optional(),
)

export const productListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  category: slugString.optional(),
  brand: repeatable(z.string().min(1)),
  condition: repeatable(conditionSchema),
  sellerId: idString.optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  freeShipping: trueFlag,
  /** Only listings flagged `sponsored`. Feeds the home page's labelled row. */
  sponsored: trueFlag,
  /** Only listings with `listPrice > price`. Feeds "Ofertas do dia". */
  onSale: trueFlag,
  sort: sortSchema.default('relevance'),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(60).default(24),
  /** `minPrice`, `maxPrice` and the price buckets are in this currency's cents. */
  currency: currencySchema.default('BRL'),
})
export type ProductListQuery = z.input<typeof productListQuerySchema>
export type ResolvedProductListQuery = z.infer<typeof productListQuerySchema>

export const facetValueSchema = z.object({
  value: z.string().min(1),
  count: z.number().int().nonnegative(),
})
export type FacetValue = z.infer<typeof facetValueSchema>

/** Bucket labels are Platform copy, formatted by the client from `min` and `max`. */
export const priceBucketSchema = z.object({
  value: z.string().min(1),
  min: centavos,
  max: centavos.nullable(),
  count: z.number().int().nonnegative(),
})
export type PriceBucket = z.infer<typeof priceBucketSchema>

export const facetsSchema = z.object({
  brand: z.array(facetValueSchema),
  condition: z.array(facetValueSchema),
  price: z.array(priceBucketSchema),
})
export type Facets = z.infer<typeof facetsSchema>

export const productListResponseSchema = paginatedSchema(productSummarySchema).extend({
  currency: currencySchema,
  facets: facetsSchema,
})
export type ProductListResponse = z.infer<typeof productListResponseSchema>

export const sellerPageResponseSchema = z.object({
  currency: currencySchema,
  seller: sellerSchema,
  stats: sellerStatsSchema,
  products: paginatedSchema(productSummarySchema),
})
export type SellerPageResponse = z.infer<typeof sellerPageResponseSchema>

/** The filter rail's price presets, in centavos. */
export const PRICE_BUCKETS = [
  { value: '0-20000', min: 0, max: 20000 },
  { value: '20000-50000', min: 20000, max: 50000 },
  { value: '50000-150000', min: 50000, max: 150000 },
  { value: '150000-400000', min: 150000, max: 400000 },
  { value: '400000+', min: 400000, max: null },
] as const satisfies ReadonlyArray<{
  value: string
  min: number
  max: number | null
}>

/**
 * The price presets in a currency. USD bounds are the BRL bounds converted by the
 * Demo exchange rate, so both currencies offer the same five ranges.
 */
export function priceBucketsFor(
  currency: Currency,
  brlPerUsd: number,
): ReadonlyArray<{ value: string; min: number; max: number | null }> {
  if (currency === 'BRL') return PRICE_BUCKETS
  return PRICE_BUCKETS.map((bucket) => {
    const min = Math.round(bucket.min / brlPerUsd)
    const max = bucket.max === null ? null : Math.round(bucket.max / brlPerUsd)
    return { value: max === null ? `${min}+` : `${min}-${max}`, min, max }
  })
}

/** `GET /api/exchange-rate`: US$ 1 = `rate` reais. An integer, so no floats on the wire. */
export const exchangeRateResponseSchema = z.object({
  base: z.literal('USD'),
  quote: z.literal('BRL'),
  rate: z.number().int().positive(),
})
export type ExchangeRateResponse = z.infer<typeof exchangeRateResponseSchema>

