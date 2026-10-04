<script setup lang="ts">
import type { PriceBucket } from '@timbre/contracts'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { formatCount } from '@/lib/format'
import { parsePrice, priceFromInputs, samePrice, type PriceRange } from '@/lib/listing'

interface Props {
  buckets: readonly PriceBucket[]
  selected: PriceRange | null
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), { disabled: false })
const emit = defineEmits<{ change: [range: PriceRange | null] }>()

const { t } = useI18n()

function toInput(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return ''
  const cents = centavos % 100
  return cents === 0 ? String(centavos / 100) : `${Math.trunc(centavos / 100)},${String(cents).padStart(2, '0')}`
}

const minText = ref('')
const maxText = ref('')
const error = ref<'invalid' | 'min-above-max' | null>(null)

watch(
  () => props.selected,
  (range) => {
    minText.value = range && range.min > 0 ? toInput(range.min) : ''
    maxText.value = toInput(range?.max)
    error.value = null
  },
  { immediate: true },
)

function pickBucket(bucket: PriceBucket): void {
  const range = parsePrice(bucket.value)
  emit('change', samePrice(range, props.selected) ? null : range)
}

function applyTyped(): void {
  const result = priceFromInputs(minText.value, maxText.value)
  if (!result.ok) {
    error.value = result.reason
    return
  }
  error.value = null
  if (!samePrice(result.range, props.selected)) emit('change', result.range)
}
</script>

<template>
  <fieldset data-testid="filter-group" data-facet="price" class="flex flex-col gap-2">
    <legend class="mb-2 text-label text-muted uppercase">{{ t('listing.facet.price') }}</legend>
    <ul class="flex flex-col gap-1">
      <li v-for="bucket in buckets" :key="bucket.value">
        <button
          type="button"
          data-testid="filter-option"
          data-facet="price"
          :data-value="bucket.value"
          :data-count="bucket.count"
          :data-selected="samePrice(parsePrice(bucket.value), selected) ? 'true' : 'false'"
          :aria-pressed="samePrice(parsePrice(bucket.value), selected)"
          :disabled="disabled || (bucket.count === 0 && !samePrice(parsePrice(bucket.value), selected))"
          class="btn w-full justify-between rounded-control px-2 py-1 text-left text-body font-normal text-ink hover:bg-sunken aria-pressed:bg-action-quiet aria-pressed:font-semibold"
          @click="pickBucket(bucket)"
        >
          <span>{{ bucket.label }}</span>
          <span data-testid="filter-option-count" class="text-body-sm text-muted">
            {{ formatCount(bucket.count) }}
          </span>
        </button>
      </li>
    </ul>
    <form
      data-testid="filter-price-form"
      class="mt-2 flex flex-col gap-2"
      novalidate
      @submit.prevent="applyTyped"
    >
      <div class="grid grid-cols-2 gap-2">
        <BaseInput
          v-model="minText"
          name="price-min"
          testid="filter-price-min"
          size="sm"
          inputmode="numeric"
          :label="t('listing.priceMin')"
          :disabled="disabled"
        />
        <BaseInput
          v-model="maxText"
          name="price-max"
          testid="filter-price-max"
          size="sm"
          inputmode="numeric"
          :label="t('listing.priceMax')"
          :disabled="disabled"
          :error="error !== null ? t(`listing.priceError.${error}`) : undefined"
          :error-code="error ?? undefined"
        />
      </div>
      <BaseButton
        testid="filter-price-apply"
        type="submit"
        variant="outline"
        size="sm"
        :disabled="disabled"
      >
        {{ t('listing.priceApplyShort') }}
      </BaseButton>
    </form>
  </fieldset>
</template>
