<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import { fetchProducts } from '@/api/catalog'
import ProductGrid from '@/components/catalog/ProductGrid.vue'
import { useRequest } from '@/composables/useRequest'

interface Props {
  testid: string
  heading: string
  /** `GET /api/products` query for this row. */
  params: URLSearchParams
  note?: string
  seeAllTo?: RouteLocationRaw
  sponsoredRow?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  note: undefined,
  seeAllTo: undefined,
  sponsoredRow: false,
})

const { t } = useI18n()
const headingId = `${props.testid}-heading`
const request = useRequest(
  () => props.params.toString(),
  (signal) => fetchProducts(props.params, { signal }),
)
</script>

<template>
  <section
    :data-testid="testid"
    :data-sponsored="sponsoredRow ? 'true' : undefined"
    :aria-labelledby="headingId"
    class="flex flex-col gap-3"
    :class="sponsoredRow ? 'rounded-card border border-dashed border-line-heavy p-4' : ''"
  >
    <div class="flex items-baseline justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h2 :id="headingId" class="font-wide text-display text-ink">{{ heading }}</h2>
        <p v-if="note" :data-testid="`${testid}-note`" class="text-body-sm text-ink">{{ note }}</p>
      </div>
      <RouterLink
        v-if="seeAllTo"
        :to="seeAllTo"
        :data-testid="`${testid}-see-all`"
        class="shrink-0 text-body-sm font-semibold text-band underline"
      >
        {{ t('home.seeAll') }}
      </RouterLink>
    </div>
    <ProductGrid
      :testid="testid"
      layout="row"
      :status="request.status.value"
      :items="request.data.value?.items ?? []"
      :skeleton-count="4"
      :sponsored-row="sponsoredRow"
      :error-title="t('home.sectionErrorTitle')"
      :error-description="t('home.sectionErrorDescription')"
      :error-code="request.error.value?.code"
      @retry="request.retry"
    >
      <template #empty>
        <p class="card px-4 py-6 text-center text-body text-muted">{{ t('home.sectionEmpty') }}</p>
      </template>
    </ProductGrid>
  </section>
</template>
