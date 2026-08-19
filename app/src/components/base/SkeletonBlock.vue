<script setup lang="ts">
interface Props {
  testid?: string
  width?: string
  height?: string
  rounded?: 'control' | 'card' | 'full'
}
withDefaults(defineProps<Props>(), {
  testid: 'skeleton-block',
  width: 'w-full',
  height: 'h-4',
  rounded: 'control',
})
const radii: Record<NonNullable<Props['rounded']>, string> = {
  control: 'rounded-control',
  card: 'rounded-card',
  full: 'rounded-full',
}
</script>
<template>
  <div
    :data-testid="testid"
    aria-hidden="true"
    class="animate-pulse bg-sunken"
    :class="[width, height, radii[rounded]]"
  />
</template>