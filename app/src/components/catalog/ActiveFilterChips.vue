<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useFilterLabel } from '@/composables/useFilterLabel'
import { filterKey, formatPriceParam, type ListingFilter } from '@/lib/listing'

interface Props {
  filters: readonly ListingFilter[]
}
defineProps<Props>()
defineEmits<{ remove: [filter: ListingFilter]; clear: [] }>()

const { t } = useI18n()
const labelOf = useFilterLabel()

function valueOf(filter: ListingFilter): string {
  switch (filter.facet) {
    case 'freeShipping':
      return 'true'
    case 'price':
      return formatPriceParam(filter.value)
    default:
      return filter.value
  }
}
</script>

<template>
  <div
    v-if="filters.length > 0"
    data-testid="filter-chips"
    class="flex flex-wrap items-center gap-2"
  >
    <h2 class="sr-only">{{ t('listing.chipsLabel') }}</h2>
    <ul class="contents">
      <li v-for="filter in filters" :key="filterKey(filter)">
        <button
          type="button"
          data-testid="filter-chip"
          :data-facet="filter.facet"
          :data-value="valueOf(filter)"
          :aria-label="t('listing.chipRemove', { label: labelOf(filter) })"
          class="btn h-8 rounded-full border-line-heavy bg-surface px-3 text-body-sm font-medium text-ink hover:border-band"
          @click="$emit('remove', filter)"
        >
          {{ labelOf(filter) }}
          <svg class="size-3 text-muted" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </li>
    </ul>
    <button
      type="button"
      data-testid="filter-clear-all"
      class="btn h-8 px-2 text-body-sm text-band underline hover:bg-sunken"
      @click="$emit('clear')"
    >
      {{ t('listing.clearAll') }}
    </button>
  </div>
</template>
