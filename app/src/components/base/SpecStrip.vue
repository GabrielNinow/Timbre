<script setup lang="ts">
import type { Condition, SellerTier, UF } from '@timbre/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  year?: number | null
  condition: Condition
  state: UF
  tier?: SellerTier | null
  testid?: string
}
const props = withDefaults(defineProps<Props>(), {
  year: null,
  tier: null,
  testid: 'spec-strip',
})

const { t } = useI18n()
interface Segment {
  key: 'year' | 'condition' | 'state' | 'tier'
  text: string
  spoken: string
}

const segments = computed<Segment[]>(() => {
  const list: Segment[] = []
  if (props.year !== null) {
    const value = String(props.year)
    list.push({ key: 'year', text: value, spoken: t('specStrip.year', { value }) })
  }
  const condition = t(`condition.${props.condition}`)
  list.push({
    key: 'condition',
    text: condition,
    spoken: t('specStrip.condition', { value: condition }),
  })
  list.push({
    key: 'state',
    text: props.state,
    spoken: t('specStrip.state', { value: props.state }),
  })

  if (props.tier !== null) {
    const tier = t(`tier.${props.tier}`)
    list.push({ key: 'tier', text: tier, spoken: t('specStrip.tier', { value: tier }) })
  }
  return list
})
const spoken = computed(() => segments.value.map((segment) => segment.spoken).join(', '))
</script>

<template>
  <p
    :data-testid="testid"
    :data-condition="condition"
    :data-tier="tier ?? 'none'"
    class="flex flex-wrap items-center gap-1 font-mono text-mono text-muted uppercase"
  >
    <template v-for="(segment, index) in segments" :key="segment.key">
      <span v-if="index > 0" aria-hidden="true" class="text-faint">·</span>
      <span :data-spec="segment.key" aria-hidden="true">{{ segment.text }}</span>
    </template>
    <span class="sr-only">{{ spoken }}</span>
  </p>
</template>