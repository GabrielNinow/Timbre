<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { fetchProducts } from '@/api/catalog'
import EmptyState from '@/components/base/EmptyState.vue'
import Pagination from '@/components/base/Pagination.vue'
import ActiveFilterChips from '@/components/catalog/ActiveFilterChips.vue'
import FilterDialog from '@/components/catalog/FilterDialog.vue'
import FilterRail from '@/components/catalog/FilterRail.vue'
import ListingHeader from '@/components/catalog/ListingHeader.vue'
import ProductGrid from '@/components/catalog/ProductGrid.vue'
import { useFilterLabel } from '@/composables/useFilterLabel'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { RAIL_BREAKPOINT, useMediaQuery } from '@/composables/useMediaQuery'
import { useRequest } from '@/composables/useRequest'
import {
  LISTING_PER_PAGE,
  activeFilters,
  clearFilters,
  goToPage,
  parseListing,
  removeFilter,
  serializeListing,
  toApiParams,
  updateListing,
  type ListingContext,
  type ListingState,
} from '@/lib/listing'
import { currencyFor } from '@/lib/language'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
void catalog.loadCategories()
const wide = useMediaQuery(RAIL_BREAKPOINT)
const labelOf = useFilterLabel()
const language = usePageLanguage()

interface Props {
  context: ListingContext
  heading: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ 'not-found': [] }>()
const context = computed(() => props.context)
const state = computed(() => parseListing(route.query, context.value))
const params = computed(() =>
  toApiParams(state.value, LISTING_PER_PAGE, currencyFor(language.value), context.value),
)
const results = useRequest(
  () => params.value.toString(),
  (signal) => fetchProducts(params.value, { signal }),
)

watch(
  () => results.error.value?.code,
  (code) => {
    if (code === 'NOT_FOUND') emit('not-found')
  },
)
const filters = computed(() => activeFilters(state.value, context.value))
const items = computed(() => results.data.value?.items ?? [])
const total = computed(() => results.data.value?.total ?? 0)
const pageCount = computed(() => Math.ceil(total.value / LISTING_PER_PAGE))
/** Same route, same params (language prefix included), new listing query. */
function routeFor(next: ListingState) {
  return { name: route.name ?? undefined, params: route.params, query: serializeListing(next, context.value) }
}
function navigate(next: ListingState): void {
  void router.push(routeFor(next))
}
</script>

<template>
  <div class="flex w-full gap-6">
    <aside v-if="wide" class="card w-66 shrink-0 self-start p-4" :aria-label="t('listing.filtersHeading')">
      <h2 class="mb-4 text-heading text-ink">{{ t('listing.filtersHeading') }}</h2>
      <FilterRail
        :state="state"
        :context="context"
        :facets="results.data.value?.facets ?? null"
        :categories="catalog.categories"
        @change="navigate"
      />
    </aside>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <ListingHeader
        :heading="heading"
        :q="state.q"
        :total="total"
        :ready="results.status.value === 'ready'"
        :sort="state.sort"
        @update:sort="navigate(updateListing(state, { sort: $event }))"
      >
        <FilterDialog v-if="!wide" :active-count="filters.length">
          <FilterRail
            :state="state"
            :context="context"
            :facets="results.data.value?.facets ?? null"
            :categories="catalog.categories"
            @change="navigate"
          />
        </FilterDialog>
      </ListingHeader>

      <ActiveFilterChips
        :filters="filters"
        @remove="navigate(removeFilter(state, $event))"
        @clear="navigate(clearFilters(state, context))"
      />

      <ProductGrid
        :status="results.status.value"
        :items="items"
        :skeleton-count="10"
        :error-title="t('listing.errorTitle')"
        :error-description="t('listing.errorDescription')"
        :error-code="results.error.value?.code"
        @retry="results.retry"
      >
        <template #empty>
          <EmptyState
            testid="results-empty-message"
            :title="state.q ? t('listing.emptyTitleFor', { q: state.q }) : t('listing.emptyTitle')"
            :description="
              filters.length > 0
                ? t('listing.emptyWithFilters', { filters: filters.map(labelOf).join(', ') })
                : t('listing.emptyNoFilters')
            "
          >
            <template v-if="filters.length > 0" #action>
              <button
                type="button"
                data-testid="results-empty-clear"
                class="btn h-10 border-band bg-surface px-4 text-body text-band hover:bg-action-quiet"
                @click="navigate(clearFilters(state, context))"
              >
                {{ t('listing.emptyClear') }}
              </button>
            </template>
          </EmptyState>
        </template>
      </ProductGrid>

      <Pagination
        v-if="results.status.value === 'ready' && pageCount > 1"
        class="self-center"
        :page="state.page"
        :page-count="pageCount"
        :to="(page) => routeFor(goToPage(state, page))"
      />
    </div>
  </div>
</template>
