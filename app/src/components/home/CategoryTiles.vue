<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import { categoryRoute } from '@/router/paths'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const catalog = useCatalogStore()
void catalog.loadCategories()
</script>

<template>
  <section data-testid="home-categories" aria-labelledby="home-categories-heading" class="flex flex-col gap-3">
    <h2 id="home-categories-heading" class="font-wide text-display text-ink">
      {{ t('home.categoriesHeading') }}
    </h2>
    <ErrorState
      v-if="catalog.status === 'error'"
      testid="home-categories-error"
      :code="catalog.error?.code"
      @retry="catalog.loadCategories(true)"
    />
    <ul
      v-else-if="catalog.status === 'ready'"
      data-testid="home-categories-grid"
      data-state="ready"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      <li v-for="category in catalog.categories" :key="category.slug">
        <RouterLink
          :to="categoryRoute(category.slug)"
          data-testid="category-tile"
          :data-category="category.slug"
          class="card flex h-full flex-col gap-1 p-4 transition-[border-color,box-shadow] duration-150 ease-out hover:border-line-heavy hover:shadow-lift"
        >
          <span class="text-heading text-ink">{{ category.name }}</span>
          <span class="font-mono text-mono text-muted uppercase">
            {{ t('home.categoryCount', { count: category.productCount }, category.productCount) }}
          </span>
        </RouterLink>
      </li>
    </ul>
    <div
      v-else
      data-testid="home-categories-skeleton"
      data-state="loading"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      <SkeletonBlock v-for="index in 6" :key="index" height="h-[74px]" rounded="card" />
    </div>
  </section>
</template>
