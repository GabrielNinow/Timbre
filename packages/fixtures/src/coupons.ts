import type { Condition } from '@timbre/contracts'

export type CouponKind = 'fixed' | 'percent' | 'free-shipping'

export interface CouponFixture {
  readonly code: string
  readonly kind: CouponKind
  readonly amount: number
  readonly maxDiscount: number | null
  readonly minSubtotal: number | null
  readonly expiresAt: string | null
  readonly onlyConditions: readonly Condition[] | null
  readonly description: string
}

export const coupons: readonly CouponFixture[] = Object.freeze([
  {
    code: 'PRIMEIRACOMPRA',
    kind: 'fixed',
    amount: 5000,
    maxDiscount: null,
    minSubtotal: null,
    expiresAt: null,
    onlyConditions: null,
    description: 'R$ 50,00 de desconto na primeira compra.',
  },
  {
    code: 'TIMBRE10',
    kind: 'percent',
    amount: 10,
    maxDiscount: 20000,
    minSubtotal: null,
    expiresAt: null,
    onlyConditions: null,
    description: '10% de desconto, limitado a R$ 200,00.',
  },
  {
    code: 'FRETEGRATIS',
    kind: 'free-shipping',
    amount: 0,
    maxDiscount: null,
    minSubtotal: null,
    expiresAt: null,
    onlyConditions: null,
    description: 'Frete grátis em qualquer modalidade.',
  },
  {
    code: 'PALCO500',
    kind: 'fixed',
    amount: 10000,
    maxDiscount: null,
    minSubtotal: 50000,
    expiresAt: null,
    onlyConditions: null,
    description: 'R$ 100,00 de desconto em compras a partir de R$ 500,00.',
  },
  {
    code: 'VERAO2024',
    kind: 'percent',
    amount: 20,
    maxDiscount: 30000,
    minSubtotal: null,
    expiresAt: '2024-12-31T23:59:59Z',
    onlyConditions: null,
    description: 'Campanha de verão de 2024, encerrada.',
  },
  {
    code: 'SOMENTENOVOS',
    kind: 'percent',
    amount: 15,
    maxDiscount: null,
    minSubtotal: null,
    expiresAt: null,
    onlyConditions: Object.freeze(['new'] as const),
    description: '15% de desconto exclusivo para produtos novos.',
  },
] as const)
