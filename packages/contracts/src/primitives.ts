import { z } from 'zod'

export const centavos = z.number().int().nonnegative()

export const centavosDelta = z.number().int()

export const ratingTenths = z.number().int().min(0).max(50)

export const percent = z.number().int().min(0).max(100)

export const idString = z.string().min(1).max(64)

export const slugString = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid slug')

export const isoDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/, 'ISO 8601 UTC timestamp expected')

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date expected')

export const conditionSchema = z.enum(['new', 'like-new', 'used'])
export type Condition = z.infer<typeof conditionSchema>

export const sellerTierSchema = z.enum(['SILVER', 'GOLD', 'PLATINUM'])
export type SellerTier = z.infer<typeof sellerTierSchema>

export const ufSchema = z.enum([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
])
export type UF = z.infer<typeof ufSchema>

export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP must have 8 digits')
  .transform((value) => value.replace('-', ''))

export const cepDigits = z.string().regex(/^\d{8}$/)

export const pageSchema = z.number().int().positive()
export const perPageSchema = z.number().int().positive().max(60)

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: pageSchema,
    perPage: perPageSchema,
    total: z.number().int().nonnegative(),
  })
}

export type Paginated<T> = {
  items: T[]
  page: number
  perPage: number
  total: number
}
