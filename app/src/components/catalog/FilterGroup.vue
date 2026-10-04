<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import { useFormat } from '@/composables/useFormat'
import type { ListingFilterFacet } from '@/lib/listing'

export interface FilterGroupOption {
  value: string
  label: string
  count: number
  selected: boolean
}
interface Props {
  facet: ListingFilterFacet
  legend: string
  options: readonly FilterGroupOption[]
  disabled?: boolean
}
withDefaults(defineProps<Props>(), { disabled: false })
defineEmits<{ toggle: [value: string] }>()

const { t } = useI18n()
const { formatCount } = useFormat()
</script>

<template>
  <fieldset data-testid="filter-group" :data-facet="facet" class="flex flex-col gap-2">
    <legend class="mb-2 text-label text-muted uppercase">{{ legend }}</legend>
    <p v-if="options.length === 0" class="text-body-sm text-muted">{{ t('listing.noOptions') }}</p>
    <BaseCheckbox
      v-for="option in options"
      :key="option.value"
      data-testid="filter-option"
      :data-facet="facet"
      :data-selected="option.selected ? 'true' : 'false'"
      :data-count="option.count"
      testid="filter-option-input"
      :name="`filter-${facet}`"
      :value="option.value"
      :label="option.label"
      :model-value="option.selected"
      :disabled="disabled || (option.count === 0 && !option.selected)"
      @update:model-value="$emit('toggle', option.value)"
    >
      <template #trailing>
        <span data-testid="filter-option-count">{{ formatCount(option.count) }}</span>
      </template>
    </BaseCheckbox>
  </fieldset>
</template>
