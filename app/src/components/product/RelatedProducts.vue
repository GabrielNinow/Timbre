<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchProducts } from '@/api/catalog'
import ProductGrid from '@/components/catalog/ProductGrid.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { useRequest } from '@/composables/useRequest'
import { currencyFor } from '@/lib/language'

interface Props {
  productId: string
  categorySlug: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const language = usePageLanguage()
const RELATED = 4

/** Same category, deterministic order (relevance, ties on id), the current product excluded. */
const params = computed(
  () => new URLSearchParams({
    category: props.categorySlug,
    perPage: String(RELATED + 1),
    ...(currencyFor(language.value) === 'USD' ? { currency: 'USD' } : {}),
  }),
)
const request = useRequest(
  () => params.value.toString(),
  (signal) => fetchProducts(params.value, { signal }),
)
const items = computed(() =>
  (request.data.value?.items ?? []).filter((item) => item.id !== props.productId).slice(0, RELATED),
)
</script>

<template>
  <section data-testid="related-products" aria-labelledby="related-heading" class="flex flex-col gap-3">
    <h2 id="related-heading" class="font-wide text-display text-ink">{{ t('product.relatedHeading') }}</h2>
    <ProductGrid
      testid="related"
      layout="row"
      :status="request.status.value"
      :items="items"
      :skeleton-count="RELATED"
      :error-code="request.error.value?.code"
      @retry="request.retry"
    >
      <template #empty>
        <p class="card px-4 py-6 text-center text-body text-muted">{{ t('product.relatedEmpty') }}</p>
      </template>
    </ProductGrid>
  </section>
</template>
