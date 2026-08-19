<script setup lang="ts">
interface Props {
  testid: string
  title: string
  description?: string
}
withDefaults(defineProps<Props>(), {
  description: undefined,
})
</script>
<template>
  <div
    :data-testid="testid"
    data-state="empty"
    role="status"
    class="card flex flex-col items-center gap-3 px-6 py-12 text-center"
  >
    <p :data-testid="`${testid}-title`" class="text-heading text-ink">{{ title }}</p>
    <p v-if="description" :data-testid="`${testid}-description`" class="text-body text-muted">
      {{ description }}
    </p>
    <div
      v-if="$slots.default"
      :data-testid="`${testid}-body`"
      class="flex flex-col items-center gap-2"
    >
      <slot />
    </div>

    <div v-if="$slots.action" class="mt-1 flex flex-wrap items-center justify-center gap-2">
      <slot name="action" />
    </div>
  </div>
</template>