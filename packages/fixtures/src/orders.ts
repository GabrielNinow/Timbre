import type { Address, CardBrand, Currency, OrderStatus, PaymentMethod, ShippingMethodId } from '@timbre/contracts'

export interface OrderItemFixture {
  readonly productId: string
  readonly variantOptionId: string | null
  readonly quantity: number
  readonly unitPrice: number
}

export interface OrderFixture {
  readonly number: string
  readonly userId: string
  readonly status: OrderStatus
  /** Every fixture order was charged in reais. */
  readonly currency: Currency
  readonly createdAt: string
  readonly items: readonly OrderItemFixture[]
  readonly couponCode: string | null
  readonly couponDiscount: number
  readonly shipping: {
    readonly address: Address
    readonly methodId: ShippingMethodId
    readonly price: number
    readonly etaDays: number
  }
  readonly payment: {
    readonly method: PaymentMethod
    readonly cardBrand: CardBrand | null
    readonly cardLast4: string | null
    readonly pixPayload: string | null
    readonly boletoDueDate: string | null
    readonly boletoLine: string | null
  }
}

const blumenau: Address = Object.freeze({
  recipient: 'Bruno Lima',
  cep: '89010000',
  street: 'Rua XV de Novembro',
  number: '1400',
  complement: 'Apto 802',
  district: 'Centro',
  city: 'Blumenau',
  state: 'SC',
})

const curitiba: Address = Object.freeze({
  recipient: 'Ricardo Nunes',
  cep: '80010000',
  street: 'Rua Marechal Deodoro',
  number: '235',
  complement: '',
  district: 'Centro',
  city: 'Curitiba',
  state: 'PR',
})

export const orders: readonly OrderFixture[] = Object.freeze([
  {
    number: 'TMB-100236',
    userId: 'u-02',
    status: 'delivered',
    currency: 'BRL',
    createdAt: '2025-12-03T18:24:00Z',
    items: [
      { productId: 'p-0601', variantOptionId: null, quantity: 2, unitPrice: 8990 },
      { productId: 'p-0603', variantOptionId: null, quantity: 1, unitPrice: 24900 },
    ],
    couponCode: null,
    couponDiscount: 0,
    shipping: {
      address: blumenau,
      methodId: 'standard',
      price: 2490,
      etaDays: 2,
    },
    payment: {
      method: 'card',
      cardBrand: 'visa',
      cardLast4: '1111',
      pixPayload: null,
      boletoDueDate: null,
      boletoLine: null,
    },
  },
  {
    number: 'TMB-100237',
    userId: 'u-05',
    status: 'delivered',
    currency: 'BRL',
    createdAt: '2026-01-14T13:10:00Z',
    items: [{ productId: 'p-0501', variantOptionId: null, quantity: 1, unitPrice: 3990 }],
    couponCode: null,
    couponDiscount: 0,
    shipping: {
      address: curitiba,
      methodId: 'standard',
      price: 2490,
      etaDays: 4,
    },
    payment: {
      method: 'pix',
      cardBrand: null,
      cardLast4: null,
      pixPayload: '00020126TIMBRE-PIX-100237520400005303986540539.905802BR',
      boletoDueDate: null,
      boletoLine: null,
    },
  },
  {
    number: 'TMB-100238',
    userId: 'u-05',
    status: 'shipped',
    currency: 'BRL',
    createdAt: '2026-05-21T15:02:00Z',
    items: [{ productId: 'p-0402', variantOptionId: null, quantity: 1, unitPrice: 129900 }],
    couponCode: null,
    couponDiscount: 0,
    shipping: {
      address: curitiba,
      methodId: 'express',
      price: 4990,
      etaDays: 2,
    },
    payment: {
      method: 'card',
      cardBrand: 'visa',
      cardLast4: '1111',
      pixPayload: null,
      boletoDueDate: null,
      boletoLine: null,
    },
  },
  {
    number: 'TMB-100239',
    userId: 'u-02',
    status: 'shipped',
    currency: 'BRL',
    createdAt: '2026-06-02T10:41:00Z',
    items: [
      { productId: 'p-0607', variantOptionId: null, quantity: 1, unitPrice: 149900 },
      { productId: 'p-0605', variantOptionId: null, quantity: 1, unitPrice: 12900 },
    ],
    couponCode: 'TIMBRE10',
    couponDiscount: 16280,
    shipping: {
      address: blumenau,
      methodId: 'standard',
      price: 0,
      etaDays: 2,
    },
    payment: {
      method: 'card',
      cardBrand: 'visa',
      cardLast4: '1111',
      pixPayload: null,
      boletoDueDate: null,
      boletoLine: null,
    },
  },
  {
    number: 'TMB-100240',
    userId: 'u-02',
    status: 'awaiting_payment',
    currency: 'BRL',
    createdAt: '2026-08-05T09:15:00Z',
    items: [{ productId: 'p-0601', variantOptionId: null, quantity: 2, unitPrice: 8990 }],
    couponCode: null,
    couponDiscount: 0,
    shipping: {
      address: blumenau,
      methodId: 'standard',
      price: 2490,
      etaDays: 2,
    },
    payment: {
      method: 'boleto',
      cardBrand: null,
      cardLast4: null,
      pixPayload: null,
      boletoDueDate: '2026-08-08',
      boletoLine: '34191.79001 01043.510047 91020.150008 5 10450000020470',
    },
  },
] as const)

export const FIRST_ORDER_NUMBER = 100_241
export const ORDER_NUMBER_PREFIX = 'TMB-'
