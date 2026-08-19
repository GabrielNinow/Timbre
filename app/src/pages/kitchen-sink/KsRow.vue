<script setup lang="ts">
interface Props {
  label: string
  stacked?: boolean
}

withDefaults(defineProps<Props>(), { stacked: false })
</script>

<template>
  <div class="flex flex-col gap-2 border-t border-line pt-3 first:border-0 first:pt-0">
    <p class="text-label text-muted uppercase">{{ label }}</p>
    <div :class="stacked ? 'flex flex-col gap-3' : 'flex flex-wrap items-start gap-6'">
      <slot />
    </div>
  </div>
</template>
