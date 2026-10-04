import { z } from 'zod'

export const errorCodeSchema = z.enum([
  'MALFORMED_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'INTERNAL_ERROR',

  'INVALID_CREDENTIALS',
  'ACCOUNT_LOCKED',
  'EMAIL_TAKEN',

  'INSUFFICIENT_STOCK',
  'CART_EMPTY',

  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'COUPON_MIN_NOT_MET',
  'COUPON_NOT_APPLICABLE',
  'COUPON_ALREADY_APPLIED',

  'CEP_NOT_FOUND',
  'SHIPPING_OPTION_UNAVAILABLE',

  'CARD_DECLINED',
  'INSUFFICIENT_FUNDS',
  'CARD_EXPIRED',
  'PAYMENT_PROCESSOR_ERROR',
  'STOCK_CHANGED',

  'PAYMENT_METHOD_UNAVAILABLE',

  'INJECTED_FAILURE',
])
export type ErrorCode = z.infer<typeof errorCodeSchema>

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string().min(1),
    fields: z.record(z.string(), z.string()).optional(),
    available: z.number().int().nonnegative().optional(),
    lineIds: z.array(z.string()).optional(),
  }),
})
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>

export const errorStatusByCode: Record<ErrorCode, number> = {
  MALFORMED_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,

  INVALID_CREDENTIALS: 401,
  ACCOUNT_LOCKED: 403,
  EMAIL_TAKEN: 422,

  INSUFFICIENT_STOCK: 409,
  CART_EMPTY: 409,

  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  COUPON_MIN_NOT_MET: 422,
  COUPON_NOT_APPLICABLE: 422,
  COUPON_ALREADY_APPLIED: 409,

  CEP_NOT_FOUND: 422,
  SHIPPING_OPTION_UNAVAILABLE: 422,

  CARD_DECLINED: 402,
  INSUFFICIENT_FUNDS: 402,
  CARD_EXPIRED: 402,
  PAYMENT_PROCESSOR_ERROR: 500,
  STOCK_CHANGED: 409,

  PAYMENT_METHOD_UNAVAILABLE: 422,

  INJECTED_FAILURE: 500,
}
