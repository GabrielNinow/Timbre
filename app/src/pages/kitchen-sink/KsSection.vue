<script setup lang="ts">
interface Props {
  id: string
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), { description: undefined })
</script>

<template>
  <section :id="id" :data-section="id" data-testid="ks-section" class="card scroll-mt-4 p-4 md:p-6">
    <h2 class="font-wide text-display text-ink">{{ title }}</h2>
    <p v-if="description" class="mt-1 text-body-sm text-muted">{{ description }}</p>
    <div class="mt-4 flex flex-col gap-6">
      <slot />
    </div>
  </section>
</template>
