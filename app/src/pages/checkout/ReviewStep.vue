<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import { createOrder } from '@/api/orders'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import CheckoutShell from '@/components/checkout/CheckoutShell.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { cardBrand } from '@/lib/card'
import { currencyFor, localizePath } from '@/lib/language'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'

const { t, te } = useI18n()
const router = useRouter()
const language = usePageLanguage()
const checkout = useCheckoutStore()
const cart = useCartStore()

const terms = ref(false)
const termsError = ref(false)
const placing = ref(false)
const failure = ref<string | null>(null)
const address = computed(() => checkout.draft.address)
const card = computed(() => checkout.card)
const at = (path: string) => localizePath(path, language.value)

async function place(): Promise<void> {
  if (!terms.value) {
    termsError.value = true
    document.querySelector<HTMLElement>('[data-testid="field-terms"]')?.focus()
    return
  }
  if (!address.value || !checkout.draft.method || !cart.cart) return
  placing.value = true
  failure.value = null
  try {
    const order = await createOrder(
      {
        shipping: address.value,
        selectedShippingId: cart.cart.selectedShippingId,
        payment: checkout.draft.method === 'card' && card.value ? { method: 'card', card: card.value } : { method: checkout.draft.method },
      },
      currencyFor(language.value),
    )
    checkout.clear()
    await cart.load()
    await router.push(at(`/orders/${order.id}`))
  } catch (caught) {
    // A decline keeps the cart and the draft: change the card and retry.
    failure.value = caught instanceof ApiError ? caught.code : 'NETWORK_ERROR'
  } finally {
    placing.value = false
  }
}
const failureText = (code: string) => (te(`checkout.paymentErrors.${code}`) ? t(`checkout.paymentErrors.${code}`) : t('checkout.paymentErrors.fallback'))
</script>

<template>
  <CheckoutShell step="review">
    <p v-if="failure" data-testid="payment-error" :data-error-code="failure" role="alert" class="rounded-card border border-fault bg-fault-quiet p-3 text-body text-fault">
      {{ failureText(failure) }}
      <RouterLink v-if="failure === 'STOCK_CHANGED'" :to="at('/cart')" class="ml-1 font-semibold underline">{{ t('cart.title') }}</RouterLink>
    </p>
    <section v-if="address" data-testid="review-shipping" aria-labelledby="review-shipping-heading" class="flex flex-col gap-1">
      <div class="flex items-center justify-between gap-2">
        <h2 id="review-shipping-heading" class="text-heading text-ink">{{ t('checkout.review.shippingHeading') }}</h2>
        <RouterLink data-testid="review-change-shipping" :to="at('/checkout/shipping')" :aria-label="t('checkout.review.changeLabel', { section: t('checkout.review.shippingHeading') })" class="text-body-sm font-semibold text-band underline">
          {{ t('checkout.review.change') }}
        </RouterLink>
      </div>
      <p class="text-body text-ink">{{ address.recipient }}</p>
      <p class="text-body text-muted">
        {{ address.street }}, {{ address.number }}<template v-if="address.complement"> — {{ address.complement }}</template> · {{ address.district }} · {{ address.city }}/{{ address.state }} · {{ address.cep }}
      </p>
    </section>
    <section data-testid="review-payment" :data-method="checkout.draft.method" aria-labelledby="review-payment-heading" class="flex flex-col gap-1 border-t border-line pt-4">
      <div class="flex items-center justify-between gap-2">
        <h2 id="review-payment-heading" class="text-heading text-ink">{{ t('checkout.review.paymentHeading') }}</h2>
        <RouterLink data-testid="review-change-payment" :to="at('/checkout/payment')" :aria-label="t('checkout.review.changeLabel', { section: t('checkout.review.paymentHeading') })" class="text-body-sm font-semibold text-band underline">
          {{ t('checkout.review.change') }}
        </RouterLink>
      </div>
      <p class="text-body text-ink">
        <template v-if="checkout.draft.method === 'card' && card">
          {{ t('checkout.review.cardEnding', { brand: t(`checkout.brands.${cardBrand(card.number)}`), last4: card.number.slice(-4) }) }}
        </template>
        <template v-else-if="checkout.draft.method">{{ t(`checkout.methods.${checkout.draft.method}`) }}</template>
      </p>
    </section>
    <div class="border-t border-line pt-4">
      <BaseCheckbox
        v-model="terms"
        name="terms"
        :label="t('checkout.terms')"
        :error="termsError && !terms ? t('checkout.termsRequired') : undefined"
        error-code="TERMS_REQUIRED"
      />
    </div>
    <BaseButton testid="place-order" size="lg" :loading="placing" @click="place">{{ t('checkout.placeOrder') }}</BaseButton>
  </CheckoutShell>
</template>
