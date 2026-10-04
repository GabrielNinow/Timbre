<script setup lang="ts">
import type { Category, Condition, Facets } from '@timbre/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import FilterGroup, { type FilterGroupOption } from '@/components/catalog/FilterGroup.vue'
import PriceFilter from '@/components/catalog/PriceFilter.vue'
import {
  toggleBrand,
  toggleCondition,
  updateListing,
  type ListingContext,
  type ListingState,
  type PriceRange,
} from '@/lib/listing'

interface Props {
  state: ListingState
  context: ListingContext
  facets: Facets | null
  categories: readonly Category[]
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), { disabled: false })
const emit = defineEmits<{ change: [state: ListingState] }>()

const { t } = useI18n()

const brandOptions = computed<FilterGroupOption[]>(() => {
  const options = (props.facets?.brand ?? []).map((facet) => ({
    value: facet.value,
    label: facet.label,
    count: facet.count,
    selected: props.state.brands.includes(facet.value),
  }))
  // A selected brand the current facets no longer list must stay removable.
  for (const brand of props.state.brands) {
    if (!options.some((option) => option.value === brand)) {
      options.push({ value: brand, label: brand, count: 0, selected: true })
    }
  }
  return options
})

const conditionOptions = computed<FilterGroupOption[]>(() =>
  (props.facets?.condition ?? []).map((facet) => ({
    value: facet.value,
    label: t(`condition.${facet.value}`),
    count: facet.count,
    selected: props.state.conditions.includes(facet.value as Condition),
  })),
)

function pickCategory(slug: string): void {
  emit('change', updateListing(props.state, { category: props.state.category === slug ? null : slug }))
}
</script>

<template>
  <div data-testid="filter-rail" class="flex flex-col gap-6">
    <fieldset
      v-if="context.pinnedCategory === undefined && categories.length > 0"
      data-testid="filter-group"
      data-facet="category"
      class="flex flex-col gap-1"
    >
      <legend class="mb-2 text-label text-muted uppercase">{{ t('listing.facet.category') }}</legend>
      <button
        v-for="category in categories"
        :key="category.slug"
        type="button"
        data-testid="filter-option"
        data-facet="category"
        :data-value="category.slug"
        :data-selected="state.category === category.slug ? 'true' : 'false'"
        :aria-pressed="state.category === category.slug"
        :disabled="disabled"
        class="btn justify-start rounded-control px-2 py-1 text-left text-body font-normal text-ink hover:bg-sunken aria-pressed:bg-action-quiet aria-pressed:font-semibold"
        @click="pickCategory(category.slug)"
      >
        {{ category.name }}
      </button>
    </fieldset>

    <FilterGroup
      facet="condition"
      :legend="t('listing.facet.condition')"
      :options="conditionOptions"
      :disabled="disabled"
      @toggle="emit('change', toggleCondition(state, $event as Condition))"
    />
    <FilterGroup
      facet="brand"
      :legend="t('listing.facet.brand')"
      :options="brandOptions"
      :disabled="disabled"
      @toggle="emit('change', toggleBrand(state, $event))"
    />
    <PriceFilter
      :buckets="facets?.price ?? []"
      :selected="state.price"
      :disabled="disabled"
      @change="emit('change', updateListing(state, { price: $event as PriceRange | null }))"
    />
    <fieldset data-testid="filter-group" data-facet="freeShipping" class="flex flex-col gap-2">
      <legend class="mb-2 text-label text-muted uppercase">{{ t('listing.facet.freeShipping') }}</legend>
      <BaseCheckbox
        data-testid="filter-option"
        data-facet="freeShipping"
        data-value="true"
        :data-selected="state.freeShipping ? 'true' : 'false'"
        testid="filter-option-input"
        name="filter-freeShipping"
        :label="t('listing.freeShippingOption')"
        :model-value="state.freeShipping"
        :disabled="disabled"
        @update:model-value="emit('change', updateListing(state, { freeShipping: $event }))"
      />
    </fieldset>
  </div>
</template>
