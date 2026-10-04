<script setup lang="ts">
import type { Sort } from '@timbre/contracts'
import { useI18n } from 'vue-i18n'
import SortSelect from '@/components/catalog/SortSelect.vue'

interface Props {
  heading: string
  q: string | null
  total: number
  /** The count renders only for a settled result, never for a stale one. */
  ready: boolean
  sort: Sort
}
defineProps<Props>()
defineEmits<{ 'update:sort': [value: Sort] }>()
defineSlots<{ default?: () => unknown }>()

const { t } = useI18n()
</script>

<template>
  <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div class="flex flex-col gap-1">
      <h1 data-testid="listing-heading" class="font-wide text-display text-ink">{{ heading }}</h1>
      <p aria-live="polite" class="min-h-[22px] text-body text-ink">
        <span v-if="ready" data-testid="results-count" :data-count="total">
          {{
            q
              ? t('listing.resultsCountFor', { count: total, q }, total)
              : t('listing.resultsCount', { count: total }, total)
          }}
        </span>
      </p>
    </div>
    <div class="flex items-end justify-between gap-3">
      <slot />
      <SortSelect :model-value="sort" @update:model-value="$emit('update:sort', $event)" />
    </div>
  </header>
</template>
