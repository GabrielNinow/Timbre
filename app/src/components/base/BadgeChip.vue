<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BadgeKind } from '@/lib/badges'

interface Props {
  kind: BadgeKind
  percent?: number
  testid?: string
}
const props = withDefaults(defineProps<Props>(), {
  percent: undefined,
  testid: 'badge',
})
const { t } = useI18n()

const skins: Record<BadgeKind, string> = {
  'sold-out': 'border-transparent bg-sunken text-ink',
  'last-unit': 'border-transparent bg-fault-quiet text-fault',
  discount: 'border-transparent bg-gain-quiet text-gain',
  'free-shipping': 'border-transparent bg-gain-quiet text-gain',
  sponsored: 'border-line-heavy bg-transparent text-muted',
}
const messageKeys = {
  'sold-out': 'badge.soldOut',
  'last-unit': 'badge.lastUnit',
  discount: 'badge.discount',
  'free-shipping': 'badge.freeShipping',
  sponsored: 'badge.sponsored',
} as const satisfies Record<BadgeKind, string>
const label = computed(() =>
  props.kind === 'discount'
    ? t(messageKeys.discount, { percent: props.percent ?? 0 })
    : t(messageKeys[props.kind]),
)
</script>
<template>
  <span
    :data-testid="testid"
    :data-badge="kind"
    :data-percent="kind === 'discount' ? percent : undefined"
    class="inline-flex items-center rounded-control border px-2 py-1 text-label uppercase"
    :class="skins[kind]"
  >
    {{ label }}
  </span>
</template>