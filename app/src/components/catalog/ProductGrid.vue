<script setup lang="ts">
import type { ProductSummary } from '@timbre/contracts'
import { useI18n } from 'vue-i18n'
import ErrorState from '@/components/base/ErrorState.vue'
import ProductCard from '@/components/catalog/ProductCard.vue'
import ProductCardSkeleton from '@/components/catalog/ProductCardSkeleton.vue'
import type { RequestStatus } from '@/composables/useRequest'

interface Props {
  status: RequestStatus
  items: readonly ProductSummary[]
  /** Prefix for the four state testids: `<testid>-grid`, `-skeleton`, `-empty`, `-error`. */
  testid?: string
  layout?: 'grid' | 'row'
  skeletonCount?: number
  sponsoredRow?: boolean
  errorTitle?: string
  errorDescription?: string
  errorCode?: string
}
const props = withDefaults(defineProps<Props>(), {
  testid: 'results',
  layout: 'grid',
  skeletonCount: 8,
  sponsoredRow: false,
  errorTitle: undefined,
  errorDescription: undefined,
  errorCode: undefined,
})
defineEmits<{ retry: [] }>()
defineSlots<{ empty?: () => unknown }>()

const { t } = useI18n()
const layouts: Record<NonNullable<Props['layout']>, string> = {
  grid: 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5',
  row: 'grid auto-cols-[minmax(11rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2 md:auto-cols-auto md:grid-flow-row md:grid-cols-4 md:gap-4 md:overflow-visible',
}
const state = () => {
  if (props.status !== 'ready') return props.status
  return props.items.length === 0 ? 'empty' : 'ready'
}
</script>

<template>
  <div :data-testid="`${testid}-state`" :data-state="state()">
    <div
      v-if="state() === 'loading'"
      :data-testid="`${testid}-skeleton`"
      data-state="loading"
      role="status"
      :aria-label="t('listing.loading')"
      :class="layouts[layout]"
    >
      <ProductCardSkeleton v-for="index in skeletonCount" :key="index" />
    </div>
    <ErrorState
      v-else-if="state() === 'error'"
      :testid="`${testid}-error`"
      :title="errorTitle"
      :description="errorDescription"
      :code="errorCode"
      @retry="$emit('retry')"
    />
    <div v-else-if="state() === 'empty'" :data-testid="`${testid}-empty`" data-state="empty">
      <slot name="empty" />
    </div>
    <ul
      v-else
      :data-testid="`${testid}-grid`"
      data-state="ready"
      :class="layouts[layout]"
    >
      <li v-for="product in items" :key="product.id" class="min-w-0">
        <ProductCard :product="product" :sponsored-row="sponsoredRow" />
      </li>
    </ul>
  </div>
</template>
