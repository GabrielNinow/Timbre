<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { fetchOrder } from '@/api/orders'
import BaseButton from '@/components/base/BaseButton.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import OrderPayment from '@/components/checkout/OrderPayment.vue'
import { useFormat } from '@/composables/useFormat'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { useRequest } from '@/composables/useRequest'
import { localizePath } from '@/lib/language'

const { t } = useI18n()
const route = useRoute()
const language = usePageLanguage()
const { formatMoney } = useFormat()
const id = computed(() => String(route.params.id))
const request = useRequest(() => id.value, (signal) => fetchOrder(id.value, signal))
const order = computed(() => request.data.value)
const code = computed(() => request.error.value?.code ?? null)
/** An order renders in the Currency it was charged in, never reconverted (ADR 0002). */
const money = (cents: number) => formatMoney(cents, order.value?.currency ?? 'BRL')
</script>

<template>
  <main id="main" data-testid="order-page" :data-state="request.status.value" class="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 md:px-6">
    <ErrorState
      v-if="code === 'FORBIDDEN' || code === 'NOT_FOUND'"
      :testid="code === 'FORBIDDEN' ? 'order-forbidden' : 'order-not-found'"
      :code="code"
      :title="code === 'FORBIDDEN' ? t('order.forbiddenTitle') : t('order.notFoundTitle')"
      :description="code === 'FORBIDDEN' ? t('order.forbiddenDescription') : t('order.notFoundDescription')"
      :show-retry="false"
    >
      <template #action>
        <BaseButton testid="order-view-all" variant="outline" :to="localizePath('/account/orders', language)">{{ t('order.viewAll') }}</BaseButton>
      </template>
    </ErrorState>
    <ErrorState v-else-if="request.status.value === 'error'" testid="order-error" :title="t('order.errorTitle')" :code="code ?? undefined" @retry="request.retry" />
    <div v-else-if="!order" data-testid="order-skeleton" data-state="loading" role="status" :aria-label="t('order.loading')" class="card flex flex-col gap-3 p-6">
      <SkeletonBlock width="w-1/2" height="h-10" />
      <SkeletonBlock height="h-40" rounded="card" />
    </div>
    <article v-else data-testid="order-confirmation" :data-order-id="order.id" :data-currency="order.currency" class="card flex flex-col gap-6 p-6">
      <header class="flex flex-col gap-2">
        <h1 class="font-wide text-display-lg text-ink">{{ t('order.title') }}</h1>
        <p class="text-label text-muted uppercase">{{ t('order.number') }}</p>
        <p data-testid="order-number" class="font-mono text-display text-ink">{{ order.number }}</p>
        <p class="text-body text-ink">
          {{ t('order.status') }}: <span data-testid="order-status" :data-status="order.status" class="font-semibold">{{ t(`orderStatus.${order.status}`) }}</span>
        </p>
      </header>
      <section aria-labelledby="order-items-heading" class="flex flex-col gap-2">
        <h2 id="order-items-heading" class="text-heading text-ink">{{ t('order.items') }}</h2>
        <ul class="flex flex-col gap-2">
          <li v-for="item in order.items" :key="item.id" data-testid="order-item" :data-product-id="item.productId" class="flex justify-between gap-4 border-b border-line pb-2 text-body">
            <span class="text-ink">
              {{ item.name }}<template v-if="item.variantName"> ({{ item.variantName }})</template>
              <span class="text-body-sm text-muted"> · {{ t('order.quantity', { count: item.quantity }, item.quantity) }} · {{ item.sellerName }}</span>
            </span>
            <span class="text-ink">{{ money(item.lineTotal) }}</span>
          </li>
        </ul>
        <dl class="flex flex-col gap-1 text-body">
          <div class="flex justify-between"><dt>{{ t('cart.subtotal') }}</dt><dd>{{ money(order.totals.subtotal) }}</dd></div>
          <div v-if="order.totals.couponDiscount > 0" class="flex justify-between text-gain"><dt>{{ t('cart.discount', { code: order.coupon?.code ?? '' }) }}</dt><dd>−{{ money(order.totals.couponDiscount) }}</dd></div>
          <div class="flex justify-between"><dt>{{ t('cart.shipping') }} · {{ t(`shippingMethod.${order.shipping.methodId}`) }}</dt><dd>{{ order.totals.shipping === 0 ? t('cart.free') : money(order.totals.shipping) }}</dd></div>
          <div class="flex justify-between border-t border-line pt-2 text-heading text-ink">
            <dt>{{ t('cart.total') }}</dt>
            <dd data-testid="order-total" :data-price="order.totals.total" :data-currency="order.currency">{{ money(order.totals.total) }}</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="order-address-heading" class="flex flex-col gap-1">
        <h2 id="order-address-heading" class="text-heading text-ink">{{ t('order.shippingAddress') }}</h2>
        <p class="text-body text-ink">{{ order.shipping.address.recipient }}</p>
        <p class="text-body text-muted">
          {{ order.shipping.address.street }}, {{ order.shipping.address.number }} · {{ order.shipping.address.district }} · {{ order.shipping.address.city }}/{{ order.shipping.address.state }}
        </p>
      </section>
      <OrderPayment :order="order" />
      <div class="flex flex-wrap gap-3">
        <BaseButton testid="order-view-all" variant="outline" :to="localizePath('/account/orders', language)">{{ t('order.viewAll') }}</BaseButton>
        <BaseButton testid="order-continue" variant="quiet" :to="localizePath('/', language)">{{ t('order.continueShopping') }}</BaseButton>
      </div>
    </article>
  </main>
</template>
