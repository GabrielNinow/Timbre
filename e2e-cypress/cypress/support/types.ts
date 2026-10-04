import type { Address, Cart, PaymentMethod } from '@timbre/contracts'

export type { Cart }

/** Shape of `sessionStorage['timbre.checkout']` (docs/testability.md). */
export interface CheckoutDraftSeed {
  address: Address | null
  method: PaymentMethod | null
  shippingDone: boolean
  paymentDone: boolean
}
