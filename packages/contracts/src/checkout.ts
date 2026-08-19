import { z } from 'zod'
import {
  appliedCouponSchema,
  cartTotalsSchema,
  shippingMethodIdSchema,
  shippingOptionSchema,
} from './cart.js'
import {
  centavos,
  cepDigits,
  cepSchema,
  idString,
  isoDate,
  isoDateTime,
  ufSchema,
} from './primitives.js'

export const shippingQuoteBodySchema = z.strictObject({ cep: cepSchema })
export type ShippingQuoteBody = z.infer<typeof shippingQuoteBodySchema>

export const shippingQuoteResponseSchema = z.object({
  cep: cepDigits,
  city: z.string().min(1),
  state: ufSchema,
  options: z.array(shippingOptionSchema),
})
export type ShippingQuoteResponse = z.infer<typeof shippingQuoteResponseSchema>

export const addressSchema = z.strictObject({
  recipient: z.string().trim().min(2, 'Informe o destinatário.').max(120),
  cep: cepSchema,
  street: z.string().trim().min(2, 'Informe a rua.').max(160),
  number: z.string().trim().min(1, 'Informe o número.').max(20),
  complement: z.string().trim().max(80).default(''),
  district: z.string().trim().min(2, 'Informe o bairro.').max(80),
  city: z.string().trim().min(2, 'Informe a cidade.').max(80),
  state: ufSchema,
})
export type Address = z.infer<typeof addressSchema>

export const paymentMethodSchema = z.enum(['cartao', 'pix', 'boleto'])
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export function normalizeCardNumber(value: string): string {
  return value.replace(/\s+/g, '')
}

export function luhnValid(value: string): boolean {
  const digits = normalizeCardNumber(value)
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = digits.charCodeAt(i) - 48
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

export const cardBrandSchema = z.enum(['visa', 'mastercard', 'amex', 'elo', 'desconhecida'])
export type CardBrand = z.infer<typeof cardBrandSchema>

export function cardBrandOf(value: string): CardBrand {
  const digits = normalizeCardNumber(value)
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^(4011|4312|4389|5041|5067|6362|6363)/.test(digits)) return 'elo'
  return 'desconhecida'
}

export function cvvLengthFor(brand: CardBrand): number {
  return brand === 'amex' ? 4 : 3
}

export const cardSchema = z
  .strictObject({
    number: z
      .string()
      .transform(normalizeCardNumber)
      .refine((value) => /^\d{13,19}$/.test(value), 'Número do cartão inválido.')
      .refine(luhnValid, 'Número do cartão inválido.'),
    holder: z.string().trim().min(2, 'Informe o nome impresso no cartão.').max(120),
    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Validade deve ser MM/AA.'),
    cvv: z.string().trim().regex(/^\d{3,4}$/, 'CVV inválido.'),
  })
  .refine((card) => card.cvv.length === cvvLengthFor(cardBrandOf(card.number)), {
    message: 'CVV inválido para a bandeira do cartão.',
    path: ['cvv'],
  })
export type Card = z.infer<typeof cardSchema>

export const paymentSchema = z
  .strictObject({
    method: paymentMethodSchema,
    card: cardSchema.optional(),
  })
  .refine((payment) => payment.method !== 'cartao' || payment.card !== undefined, {
    message: 'Informe os dados do cartão.',
    path: ['card'],
  })
export type Payment = z.infer<typeof paymentSchema>

export const createOrderBodySchema = z.strictObject({
  shipping: addressSchema,
  payment: paymentSchema,
  selectedShippingId: shippingMethodIdSchema,
})
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>

export const orderStatusSchema = z.enum([
  'aguardando_pagamento',
  'pago',
  'enviado',
  'entregue',
  'cancelado',
])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderItemSchema = z.object({
  id: idString,
  productId: idString,
  slug: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  variantName: z.string().nullable(),
  sellerId: idString,
  sellerName: z.string().min(1),
  unitPrice: centavos,
  quantity: z.number().int().positive(),
  lineTotal: centavos,
})
export type OrderItem = z.infer<typeof orderItemSchema>

export const orderPaymentSchema = z.object({
  method: paymentMethodSchema,
  cardBrand: cardBrandSchema.nullable(),
  cardLast4: z.string().regex(/^\d{4}$/).nullable(),
  pixPayload: z.string().nullable(),
  boletoDueDate: isoDate.nullable(),
  boletoLine: z.string().nullable(),
})
export type OrderPayment = z.infer<typeof orderPaymentSchema>

export const orderShippingSchema = z.object({
  address: addressSchema,
  methodId: shippingMethodIdSchema,
  methodLabel: z.string().min(1),
  price: centavos,
  etaDays: z.number().int().positive(),
})
export type OrderShipping = z.infer<typeof orderShippingSchema>

export const orderSchema = z.object({
  id: z.string().regex(/^TMB-\d{6}$/),
  number: z.string().regex(/^TMB-\d{6}$/),
  status: orderStatusSchema,
  createdAt: isoDateTime,
  userId: idString,
  items: z.array(orderItemSchema).min(1),
  coupon: appliedCouponSchema.nullable(),
  shipping: orderShippingSchema,
  payment: orderPaymentSchema,
  totals: cartTotalsSchema,
})
export type Order = z.infer<typeof orderSchema>

export const orderListResponseSchema = z.object({
  items: z.array(orderSchema),
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})
export type OrderListResponse = z.infer<typeof orderListResponseSchema>

export const CARD_OUTCOMES = {
  '4111111111111111': 'approved',
  '4000000000000002': 'CARD_DECLINED',
  '4000000000009995': 'INSUFFICIENT_FUNDS',
  '4000000000000119': 'PAYMENT_PROCESSOR_ERROR',
  '4000000000000069': 'CARD_EXPIRED',
} as const
export type CardOutcome = (typeof CARD_OUTCOMES)[keyof typeof CARD_OUTCOMES]
