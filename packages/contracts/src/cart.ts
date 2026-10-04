import { z } from 'zod'
import { productSummarySchema } from './catalog.js'
import { centavos, cepSchema, cepDigits, currencySchema, idString } from './primitives.js'

export const shippingMethodIdSchema = z.enum(['standard', 'express'])
export type ShippingMethodId = z.infer<typeof shippingMethodIdSchema>

export const shippingOptionSchema = z.object({
  id: shippingMethodIdSchema,
  price: centavos,
  etaDays: z.number().int().positive(),
})
export type ShippingOption = z.infer<typeof shippingOptionSchema>

export const cartLineVariantSchema = z.object({
  groupLabel: z.string().min(1),
  optionId: idString,
  optionName: z.string().min(1),
})
export type CartLineVariant = z.infer<typeof cartLineVariantSchema>

export const cartLineSchema = z.object({
  id: idString,
  product: productSummarySchema,
  variant: cartLineVariantSchema.nullable(),
  unitPrice: centavos,
  quantity: z.number().int().positive(),
  lineTotal: centavos,
  availableStock: z.number().int().nonnegative(),
})
export type CartLine = z.infer<typeof cartLineSchema>

export const appliedCouponSchema = z.object({
  code: z.string().min(1),
  discount: centavos,
})
export type AppliedCoupon = z.infer<typeof appliedCouponSchema>

export const cartTotalsSchema = z.object({
  subtotal: centavos,
  couponDiscount: centavos,
  shipping: centavos,
  total: centavos,
})
export type CartTotals = z.infer<typeof cartTotalsSchema>

export const cartSchema = z.object({
  id: idString,
  currency: currencySchema,
  cep: cepDigits,
  lines: z.array(cartLineSchema),
  coupon: appliedCouponSchema.nullable(),
  shippingOptions: z.array(shippingOptionSchema),
  selectedShippingId: shippingMethodIdSchema,
  totals: cartTotalsSchema,
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemBodySchema = z.strictObject({
  productId: idString,
  variantOptionId: idString.optional(),
  quantity: z.number().int().positive().max(99).default(1),
})
export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>

export const updateCartItemBodySchema = z.strictObject({
  quantity: z.number().int().min(0).max(99),
})
export type UpdateCartItemBody = z.infer<typeof updateCartItemBodySchema>

export const couponBodySchema = z.strictObject({
  code: z.string().trim().min(1, 'Enter a coupon.').max(40).toUpperCase(),
})
export type CouponBody = z.infer<typeof couponBodySchema>

export const setCartCepBodySchema = z.strictObject({ cep: cepSchema })
export type SetCartCepBody = z.infer<typeof setCartCepBodySchema>

export const setShippingMethodBodySchema = z.strictObject({
  shippingId: shippingMethodIdSchema,
})
export type SetShippingMethodBody = z.infer<typeof setShippingMethodBodySchema>

export const FREE_SHIPPING_THRESHOLD = 30000

/**
 * The Demo exchange rate (ADR 0002): US$ 1 = R$ 5,00. Fixed and fictional, so a
 * dollar price is always the reais price divided by five, rounded half-up. Lives
 * here, beside the other money rules, because the API prices with it and the app
 * converts a price filter with it when the Page language switches.
 */
export const BRL_PER_USD = 5
export const SHIPPING_PRICES: Record<ShippingMethodId, number> = {
  standard: 2490,
  express: 4990,
}
export const DEFAULT_CEP = '89010000'
