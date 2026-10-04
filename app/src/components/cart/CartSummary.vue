<script setup lang="ts">
import type { Cart, ShippingMethodId } from '@timbre/contracts'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import CouponForm from '@/components/cart/CouponForm.vue'
import { useFormat } from '@/composables/useFormat'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { localizePath } from '@/lib/language'
import { useCartStore } from '@/stores/cart'

interface Props {
  cart: Cart
}
defineProps<Props>()
const { t } = useI18n()
const { formatPrice } = useFormat()
const language = usePageLanguage()
const store = useCartStore()

function choose(id: ShippingMethodId): void {
  void store.setShipping(id).catch(() => undefined)
}
</script>

<template>
  <section
    data-testid="cart-summary"
    :data-currency="cart.currency"
    aria-labelledby="summary-heading"
    class="card flex flex-col gap-4 p-5 lg:sticky lg:top-32"
  >
    <h2 id="summary-heading" class="text-heading text-ink">{{ t('cart.summaryHeading') }}</h2>
    <dl class="flex flex-col gap-2 text-body">
      <div class="flex justify-between gap-4">
        <dt>{{ t('cart.subtotal') }}</dt>
        <dd data-testid="summary-subtotal" :data-price="cart.totals.subtotal">{{ formatPrice(cart.totals.subtotal) }}</dd>
      </div>
      <div v-if="cart.totals.couponDiscount > 0" class="flex justify-between gap-4 text-gain">
        <dt>{{ t('cart.discount', { code: cart.coupon?.code ?? '' }) }}</dt>
        <dd data-testid="summary-discount" :data-price="cart.totals.couponDiscount">−{{ formatPrice(cart.totals.couponDiscount) }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt>{{ t('cart.shipping') }}</dt>
        <dd data-testid="summary-shipping" :data-price="cart.totals.shipping">
          {{ cart.totals.shipping === 0 ? t('cart.free') : formatPrice(cart.totals.shipping) }}
        </dd>
      </div>
    </dl>

    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 text-label text-muted uppercase">{{ t('cart.shippingMethod') }}</legend>
      <label
        v-for="option in cart.shippingOptions"
        :key="option.id"
        data-testid="shipping-method"
        :data-method="option.id"
        :data-price="option.price"
        :data-selected="option.id === cart.selectedShippingId ? 'true' : 'false'"
        class="flex cursor-pointer items-center justify-between gap-3 rounded-control border border-line px-3 py-2 has-[:checked]:border-band has-[:checked]:bg-action-quiet"
      >
        <span class="flex items-center gap-2">
          <input
            type="radio"
            name="shipping-method"
            class="size-4 accent-band"
            :value="option.id"
            :checked="option.id === cart.selectedShippingId"
            :disabled="store.pending !== null"
            @change="choose(option.id)"
          >
          <span class="flex flex-col">
            <span class="text-body text-ink">{{ t(`shippingMethod.${option.id}`) }}</span>
            <span class="text-body-sm text-muted">{{ t('cart.eta', { days: option.etaDays }, option.etaDays) }}</span>
          </span>
        </span>
        <span class="text-body font-semibold">{{ option.price === 0 ? t('cart.free') : formatPrice(option.price) }}</span>
      </label>
    </fieldset>

    <CouponForm :coupon="cart.coupon" />

    <div class="flex items-baseline justify-between gap-4 border-t border-line pt-4">
      <span class="text-heading text-ink">{{ t('cart.total') }}</span>
      <span data-testid="summary-total" :data-price="cart.totals.total" class="text-price text-ink">{{ formatPrice(cart.totals.total) }}</span>
    </div>
    <BaseButton testid="checkout-submit" size="lg" block :to="localizePath('/checkout/shipping', language)">
      {{ t('cart.checkout') }}
    </BaseButton>
  </section>
</template>
