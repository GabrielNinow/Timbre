<script setup lang="ts">
import type { VariantGroup } from '@timbre/contracts'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/composables/useFormat'

interface Props {
  groups: readonly VariantGroup[]
  selectedId: string | null
}
defineProps<Props>()
defineEmits<{ select: [optionId: string] }>()

const { t } = useI18n()
const { formatPrice } = useFormat()
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset
      v-for="group in groups"
      :key="group.label"
      data-testid="variant-group"
      :data-group="group.label"
      class="flex flex-col gap-2"
    >
      <legend class="mb-2 text-label text-muted uppercase">{{ group.label }}</legend>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="option in group.options"
          :key="option.id"
          data-testid="variant-option"
          :data-option-id="option.id"
          :data-selected="option.id === selectedId ? 'true' : 'false'"
          :data-stock-state="option.stock === 0 ? 'sold-out' : 'in-stock'"
          class="btn h-10 cursor-pointer gap-2 rounded-control border-line-heavy bg-surface px-3 text-body font-normal text-ink has-[:checked]:border-band has-[:checked]:bg-action-quiet has-[:checked]:font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-band"
        >
          <input
            type="radio"
            class="sr-only"
            :name="`variant-${group.label}`"
            :value="option.id"
            :checked="option.id === selectedId"
            @change="$emit('select', option.id)"
          >
          <span :class="option.stock === 0 ? 'line-through decoration-muted' : ''">{{ option.name }}</span>
          <span v-if="option.priceDelta > 0" class="text-body-sm text-muted">
            {{ t('product.optionDelta', { delta: formatPrice(option.priceDelta) }) }}
          </span>
          <span v-if="option.stock === 0" class="text-body-sm text-muted">{{ t('product.optionSoldOut') }}</span>
        </label>
      </div>
    </fieldset>
  </div>
</template>
