<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ListingView from '@/components/catalog/ListingView.vue'
import type { ListingContext } from '@/lib/listing'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()
const catalog = useCatalogStore()
void catalog.loadCategories()

const context = computed<ListingContext>(() => {
  const slug = route.params.categorySlug
  return typeof slug === 'string' ? { pinnedCategory: slug } : {}
})
const heading = computed(() => {
  const slug = context.value.pinnedCategory
  if (slug === undefined) return t('listing.searchHeading')
  return catalog.bySlug.has(slug) ? t(`category.${slug}`) : ''
})
const notFound = ref(false)
watch(() => route.path, () => (notFound.value = false))
</script>

<template>
  <NotFoundPage v-if="notFound" />
  <main
    v-else
    id="main"
    data-testid="listing-page"
    :data-category="context.pinnedCategory"
    class="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6"
  >
    <ListingView :context="context" :heading="heading" @not-found="notFound = true" />
  </main>
</template>
