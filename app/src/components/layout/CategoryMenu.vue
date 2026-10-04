<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BasePopover from '@/components/base/BasePopover.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { categoryRoute } from '@/router/paths'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const catalog = useCatalogStore()
const language = usePageLanguage()
void catalog.loadCategories()
const open = ref(false)
</script>

<template>
  <BasePopover
    v-model:open="open"
    testid="category-menu"
    content-testid="category-menu-content"
    :title="t('header.categories')"
  >
    <template #trigger="{ open: isOpen }">
      <button
        type="button"
        class="btn h-8 px-2 text-body-sm text-on-band hover:bg-band-hover focus-visible:outline-on-band"
        :aria-expanded="isOpen"
      >
        {{ t('header.categories') }}
        <svg class="size-3" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <path d="m4 6.5 4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </template>
    <p v-if="catalog.status === 'error'" data-testid="category-menu-error" class="text-body-sm text-fault">
      {{ t('header.categoriesError') }}
    </p>
    <ul v-else class="flex flex-col">
      <li v-for="category in catalog.categories" :key="category.slug">
        <RouterLink
          :to="categoryRoute(category.slug, language)"
          data-testid="category-menu-item"
          :data-category="category.slug"
          class="block rounded-control px-2 py-2 text-body text-ink hover:bg-sunken"
          @click="open = false"
        >
          {{ t(`category.${category.slug}`) }}
        </RouterLink>
      </li>
    </ul>
  </BasePopover>
</template>
