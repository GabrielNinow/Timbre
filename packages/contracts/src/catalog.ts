import { z } from 'zod'
import {
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
} from './primitives.js'

export const categorySchema = z.object({
  id: idString,
  slug: slugString,
  name: z.string().min(1),
  productCount: z.number().int().nonnegative(),
})
export type Category = z.infer<typeof categorySchema>

export const categoryListSchema = z.object({ items: z.array(categorySchema) })
export type CategoryList = z.infer<typeof categoryListSchema>

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
  description: z.string().min(1),
  images: z.array(z.string().min(1)).min(1),
  specs: z.array(productSpecSchema),
  variants: z.array(variantGroupSchema).optional(),
})
export type ProductDetail = z.infer<typeof productDetailSchema>

export const sortSchema = z.enum(['relevancia', 'menor-preco', 'maior-preco', 'mais-recentes'])
export type Sort = z.infer<typeof sortSchema>

const repeatable = <T extends z.ZodType>(item: T) =>
  z.preprocess(
    (value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
    z.array(item).optional(),
  )

export const productListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  category: slugString.optional(),
  brand: repeatable(z.string().min(1)),
  condition: repeatable(conditionSchema),
  sellerId: idString.optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  freeShipping: z
    .preprocess((value) => (value === undefined ? undefined : value === 'true' || value === true), z.boolean().optional()),
  sort: sortSchema.default('relevancia'),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(60).default(24),
})
export type ProductListQuery = z.input<typeof productListQuerySchema>
export type ResolvedProductListQuery = z.infer<typeof productListQuerySchema>

export const facetValueSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
})
export type FacetValue = z.infer<typeof facetValueSchema>

export const priceBucketSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
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
  facets: facetsSchema,
})
export type ProductListResponse = z.infer<typeof productListResponseSchema>

export const sellerPageResponseSchema = z.object({
  seller: sellerSchema,
  stats: sellerStatsSchema,
  products: paginatedSchema(productSummarySchema),
})
export type SellerPageResponse = z.infer<typeof sellerPageResponseSchema>

export const PRICE_BUCKETS = [
  { value: '0-20000', label: 'Até R$ 200', min: 0, max: 20000 },
  { value: '20000-50000', label: 'R$ 200 a R$ 500', min: 20000, max: 50000 },
  { value: '50000-150000', label: 'R$ 500 a R$ 1.500', min: 50000, max: 150000 },
  { value: '150000-400000', label: 'R$ 1.500 a R$ 4.000', min: 150000, max: 400000 },
  { value: '400000+', label: 'Acima de R$ 4.000', min: 400000, max: null },
] as const satisfies ReadonlyArray<{
  value: string
  label: string
  min: number
  max: number | null
}>
