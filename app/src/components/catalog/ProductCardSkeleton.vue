<script setup lang="ts">
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
</script>

<template>
  <div data-testid="product-card-skeleton" aria-hidden="true" class="card flex h-full flex-col overflow-hidden">
    <div class="aspect-square border-b border-line p-3">
      <SkeletonBlock height="h-full" rounded="card" />
    </div>
    <div class="flex flex-1 flex-col gap-2 p-3">
      <SkeletonBlock width="w-1/3" height="h-6" />
      <SkeletonBlock width="w-2/3" height="h-8" />
      <SkeletonBlock width="w-3/4" height="h-4" />
      <SkeletonBlock height="h-4" />
      <SkeletonBlock width="w-1/2" height="h-4" />
    </div>
  </div>
</template>
