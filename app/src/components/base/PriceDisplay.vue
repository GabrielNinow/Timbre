<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { discountPercent, formatPrice, splitPrice } from '@/lib/format'

interface Props {
  price: number
  listPrice?: number | null
  testid?: string
}
const props = withDefaults(defineProps<Props>(), {
  listPrice: null,
  testid: 'price-display',
})
const { t } = useI18n()

const parts = computed(() => splitPrice(props.price))
const percent = computed(() => discountPercent(props.price, props.listPrice))
const showList = computed(() => percent.value !== null && props.listPrice !== null)
const spoken = computed(() =>
  percent.value !== null && props.listPrice !== null
    ? t('price.srDiscounted', {
        list: formatPrice(props.listPrice),
        value: formatPrice(props.price),
        percent: percent.value,
      })
    : t('price.srSimple', { value: formatPrice(props.price) }),
)
</script>
<template>
  <div
    :data-testid="testid"
    :data-price="price"
    :data-list-price="listPrice ?? undefined"
    :data-discount-percent="percent ?? undefined"
    class="flex flex-col items-start"
  >
    <span
      v-if="showList"
      :data-testid="`${testid}-list`"
      aria-hidden="true"
      class="text-body-sm text-muted line-through"
    >
      {{ formatPrice(listPrice as number) }}
    </span>
    <span class="flex items-baseline gap-2">
      <span aria-hidden="true" class="flex items-baseline gap-1 text-ink">
        <span class="text-body-sm text-muted">{{ parts.currency }}</span>
        <span class="text-price">{{ parts.integer }}</span>
        <span class="text-price-cents">{{ parts.decimalSeparator }}{{ parts.cents }}</span>
      </span>

      <span
        v-if="percent !== null"
        :data-testid="`${testid}-discount`"
        aria-hidden="true"
        class="text-body-sm font-semibold text-gain"
      >
        {{ t('price.discountBadge', { percent }) }}
      </span>
      <span class="sr-only">{{ spoken }}</span>
    </span>
  </div>
</template>