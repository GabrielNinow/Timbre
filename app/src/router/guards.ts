import type { Router } from 'vue-router'
import { currencyFor, languageOfPath, localizePath } from '@/lib/language'
import { signInLocation } from '@/lib/redirect'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'

declare module 'vue-router' {
  interface RouteMeta {
    /** Requires a signed-in Demo account (or a disposable sign-up). */
    auth?: boolean
    /** Requires a non-empty cart. */
    cart?: boolean
    /** The checkout step this route is; each requires the ones before it. */
    step?: 'shipping' | 'payment' | 'review'
  }
}

export function installGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const { auth: needsAuth, cart: needsCart, step } = to.meta
    if (!needsAuth && !needsCart && !step) return true
    const language = languageOfPath(to.path)
    const at = (path: string) => localizePath(path, language)

    const auth = useAuthStore()
    await auth.ensure()
    if (needsAuth && !auth.signedIn) return signInLocation(to.fullPath, language)

    if (needsCart) {
      const cart = await useCartStore().ensure()
      if (!cart || cart.lines.length === 0) return at('/cart')
    }

    const checkout = useCheckoutStore()
    const { shippingDone, paymentDone, method } = checkout.draft
    if (step === 'payment' && !shippingDone) return at('/checkout/shipping')
    if (step === 'review') {
      if (!shippingDone) return at('/checkout/shipping')
      if (!paymentDone) return at('/checkout/payment')
      // Pix and boleto move reais only (ADR 0002): the chosen method may vanish on a language switch.
      if (currencyFor(language) === 'USD' && method !== 'card') {
        checkout.reopenPayment()
        return `${at('/checkout/payment')}?reason=PAYMENT_METHOD_UNAVAILABLE`
      }
      if (method === 'card' && !checkout.card) {
        checkout.reopenPayment()
        return `${at('/checkout/payment')}?reason=CARD_REENTRY`
      }
    }
    return true
  })
}
