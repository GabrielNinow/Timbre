<script setup lang="ts">
import type { SellerTier } from '@timbre/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  tier: SellerTier | null
  showLabel?: boolean
  testid?: string
}
const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  testid: 'seller-tier',
})
const { t } = useI18n()
const chevrons: Record<SellerTier, number> = { SILVER: 1, GOLD: 2, PLATINUM: 3 }

const count = computed(() => (props.tier === null ? 0 : chevrons[props.tier]))
const tierName = computed(() => (props.tier === null ? '' : t(`tier.${props.tier}`)))
const spoken = computed(() => t('tierMark.label', { tier: tierName.value }))
</script>
<template>
  <span
    v-if="tier !== null"
    :data-testid="testid"
    :data-tier="tier"
    :data-chevrons="count"
    class="inline-flex items-center gap-1"
  >
    <span aria-hidden="true" class="inline-flex items-center text-action">
      <svg
        v-for="index in count"
        :key="index"
        class="size-3 shrink-0"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M2 7.75 6 3.75l4 4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span
      v-if="showLabel"
      :data-testid="`${testid}-label`"
      aria-hidden="true"
      class="text-label text-muted"
    >
      {{ tierName }}
    </span>
    <span class="sr-only">{{ spoken }}</span>
  </span>
</template>
