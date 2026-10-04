<script setup lang="ts">
import type { Cart } from '@timbre/contracts'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/composables/useFormat'

interface Props {
  cart: Cart
  showItems?: boolean
}
withDefaults(defineProps<Props>(), { showItems: false })
const { t } = useI18n()
const { formatPrice } = useFormat()
</script>

<template>
  <section data-testid="checkout-summary" :data-currency="cart.currency" aria-labelledby="checkout-summary-heading" class="card flex flex-col gap-3 p-5">
    <h2 id="checkout-summary-heading" class="text-heading text-ink">{{ t('cart.summaryHeading') }}</h2>
    <ul v-if="showItems" class="flex flex-col gap-2 border-b border-line pb-3">
      <li v-for="line in cart.lines" :key="line.id" data-testid="checkout-summary-line" :data-line-id="line.id" class="flex justify-between gap-3 text-body-sm">
        <span class="text-ink">{{ line.quantity }} × {{ line.product.name }}<template v-if="line.variant"> ({{ line.variant.optionName }})</template></span>
        <span class="text-ink">{{ formatPrice(line.lineTotal) }}</span>
      </li>
    </ul>
    <dl class="flex flex-col gap-2 text-body">
      <div class="flex justify-between gap-4"><dt>{{ t('cart.subtotal') }}</dt><dd data-testid="summary-subtotal" :data-price="cart.totals.subtotal">{{ formatPrice(cart.totals.subtotal) }}</dd></div>
      <div v-if="cart.totals.couponDiscount > 0" class="flex justify-between gap-4 text-gain">
        <dt>{{ t('cart.discount', { code: cart.coupon?.code ?? '' }) }}</dt>
        <dd data-testid="summary-discount" :data-price="cart.totals.couponDiscount">−{{ formatPrice(cart.totals.couponDiscount) }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt>{{ t('cart.shipping') }} · {{ t(`shippingMethod.${cart.selectedShippingId}`) }}</dt>
        <dd data-testid="summary-shipping" :data-price="cart.totals.shipping">{{ cart.totals.shipping === 0 ? t('cart.free') : formatPrice(cart.totals.shipping) }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt class="text-heading text-ink">{{ t('cart.total') }}</dt>
        <dd data-testid="summary-total" :data-price="cart.totals.total" class="text-price text-ink">{{ formatPrice(cart.totals.total) }}</dd>
      </div>
    </dl>
  </section>
</template>
