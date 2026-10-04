<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  images: readonly string[]
  name: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const active = ref(0)
watch(() => props.images, () => (active.value = 0))
const current = computed(() => props.images[active.value] ?? props.images[0] ?? '')
</script>

<template>
  <section data-testid="product-gallery" :aria-label="t('product.galleryLabel')" class="flex flex-col gap-3">
    <div class="card aspect-square p-6">
      <img
        :src="current"
        :alt="name"
        data-testid="product-gallery-main"
        :data-index="active"
        width="640"
        height="640"
        class="size-full object-contain"
      >
    </div>
    <ul v-if="images.length > 1" class="flex gap-2">
      <li v-for="(image, index) in images" :key="image">
        <button
          type="button"
          data-testid="product-gallery-thumbnail"
          :data-index="index"
          :aria-pressed="index === active"
          :aria-label="t('product.thumbnail', { index: index + 1, total: images.length })"
          class="card size-16 p-1 aria-pressed:border-band"
          @click="active = index"
        >
          <img :src="image" alt="" width="64" height="64" class="size-full object-contain">
        </button>
      </li>
    </ul>
  </section>
</template>
