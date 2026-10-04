<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { fetchOrders } from '@/api/orders'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import { useFormat } from '@/composables/useFormat'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { useRequest } from '@/composables/useRequest'
import { localizePath } from '@/lib/language'

const { t } = useI18n()
const language = usePageLanguage()
const { formatDate, formatMoney } = useFormat()
const request = useRequest(() => 'orders', (signal) => fetchOrders(signal))
</script>

<template>
  <main id="main" data-testid="orders-page" :data-state="request.status.value" class="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 md:px-6">
    <h1 class="font-wide text-display-lg text-ink">{{ t('orders.title') }}</h1>
    <ErrorState v-if="request.status.value === 'error'" testid="orders-error" :title="t('orders.errorTitle')" :code="request.error.value?.code" @retry="request.retry" />
    <div v-else-if="request.data.value === null" data-testid="orders-skeleton" data-state="loading" role="status" :aria-label="t('orders.loading')" class="flex flex-col gap-2">
      <SkeletonBlock v-for="index in 3" :key="index" height="h-16" rounded="card" />
    </div>
    <EmptyState v-else-if="request.data.value.length === 0" testid="orders-empty" :title="t('orders.empty')">
      <template #action>
        <BaseButton testid="orders-browse" variant="outline" :to="localizePath('/', language)">{{ t('orders.emptyAction') }}</BaseButton>
      </template>
    </EmptyState>
    <table v-else data-testid="orders-list" class="card w-full border-separate border-spacing-0 overflow-hidden text-left">
      <thead>
        <tr class="text-label text-muted uppercase">
          <th scope="col" class="border-b border-line p-3">{{ t('orders.number') }}</th>
          <th scope="col" class="border-b border-line p-3">{{ t('orders.date') }}</th>
          <th scope="col" class="border-b border-line p-3">{{ t('orders.status') }}</th>
          <th scope="col" class="border-b border-line p-3 text-right">{{ t('orders.total') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in request.data.value" :key="order.id" data-testid="order-row" :data-order-id="order.id" :data-status="order.status" class="text-body">
          <td class="border-b border-line p-3">
            <RouterLink :to="localizePath(`/orders/${order.id}`, language)" data-testid="order-row-link" :aria-label="t('orders.view', { number: order.number })" class="font-mono font-semibold text-band underline">
              {{ order.number }}
            </RouterLink>
          </td>
          <td class="border-b border-line p-3 text-ink">{{ formatDate(order.createdAt) }}</td>
          <td class="border-b border-line p-3 text-ink">{{ t(`orderStatus.${order.status}`) }}</td>
          <td class="border-b border-line p-3 text-right text-ink" :data-currency="order.currency">{{ formatMoney(order.totals.total, order.currency) }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
