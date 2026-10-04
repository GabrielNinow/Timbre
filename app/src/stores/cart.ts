import type { Cart, Currency, ShippingMethodId } from '@timbre/contracts'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import * as api from '@/api/cart'
import { ApiError } from '@/api/client'
import type { RequestStatus } from '@/composables/useRequest'
import { cartUnitCount } from '@/lib/cart'

/** What is in flight, so the triggering control can show `data-loading` synchronously. */
export type CartAction =
  | { kind: 'add' }
  | { kind: 'quantity' | 'remove'; lineId: string }
  | { kind: 'coupon' | 'coupon-remove' | 'cep' | 'shipping' }

/**
 * A cache of the server's cart, never the source of truth (rule 4). Every mutation
 * replaces it with the API's response; no money is computed here.
 */
export const useCartStore = defineStore('cart', () => {
  const cart = shallowRef<Cart | null>(null)
  const status = shallowRef<RequestStatus | 'idle'>('idle')
  const error = shallowRef<ApiError | null>(null)
  const pending = shallowRef<CartAction | null>(null)
  /** Set when the API dropped a coupon that stopped qualifying after a change. */
  const droppedCoupon = shallowRef<string | null>(null)
  let currency: Currency = 'BRL'
  let loadId = 0

  const count = computed(() => cartUnitCount(cart.value?.lines ?? []))

  function accept(next: Cart, couponRemovedByVisitor = false): Cart {
    const previous = cart.value?.coupon?.code ?? null
    droppedCoupon.value = previous && !next.coupon && !couponRemovedByVisitor ? previous : null
    cart.value = next
    status.value = 'ready'
    error.value = null
    return next
  }

  async function load(nextCurrency: Currency): Promise<void> {
    currency = nextCurrency
    const id = ++loadId
    status.value = 'loading'
    try {
      const next = await api.fetchCart(currency)
      if (id === loadId) accept(next)
    } catch (caught) {
      if (id !== loadId) return
      error.value = caught instanceof ApiError ? caught : new ApiError('NETWORK_ERROR', String(caught), null)
      status.value = 'error'
    }
  }

  /** Runs one mutation; the caller handles the ApiError (inline messages live with the control). */
  async function run(action: CartAction, call: () => Promise<Cart>, couponRemoved = false): Promise<Cart> {
    pending.value = action
    try {
      return accept(await call(), couponRemoved)
    } finally {
      pending.value = null
    }
  }

  return {
    cart,
    status,
    error,
    pending,
    droppedCoupon,
    count,
    load,
    add: (item: { productId: string; variantOptionId?: string; quantity: number }) =>
      run({ kind: 'add' }, () => api.addCartItem(item, currency)),
    setQuantity: (lineId: string, quantity: number) =>
      run({ kind: 'quantity', lineId }, () => api.updateCartLine(lineId, quantity, currency)),
    remove: (lineId: string) => run({ kind: 'remove', lineId }, () => api.removeCartLine(lineId, currency)),
    applyCoupon: (code: string) => run({ kind: 'coupon' }, () => api.applyCoupon(code, currency)),
    removeCoupon: () => run({ kind: 'coupon-remove' }, () => api.removeCoupon(currency), true),
    setCep: (cep: string) => run({ kind: 'cep' }, () => api.setCartCep(cep, currency)),
    setShipping: (shippingId: ShippingMethodId) =>
      run({ kind: 'shipping' }, () => api.setCartShipping(shippingId, currency)),
  }
})
