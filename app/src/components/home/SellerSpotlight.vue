<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { fetchSeller } from '@/api/catalog'
import ErrorState from '@/components/base/ErrorState.vue'
import SellerTierMark from '@/components/base/SellerTierMark.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ProductGrid from '@/components/catalog/ProductGrid.vue'
import { useRequest } from '@/composables/useRequest'
import { SPOTLIGHT_SELLER_SLUG } from '@/config'
import { formatCount, formatPercent, formatRating } from '@/lib/format'
import { sellerPath } from '@/router/paths'

const { t } = useI18n()
const params = new URLSearchParams({ perPage: '4' })
const request = useRequest(
  () => SPOTLIGHT_SELLER_SLUG,
  (signal) => fetchSeller(SPOTLIGHT_SELLER_SLUG, params, { signal }),
)
</script>

<template>
  <section
    data-testid="seller-spotlight"
    :data-state="request.status.value"
    :data-seller-id="request.data.value?.seller.id"
    aria-labelledby="seller-spotlight-heading"
    class="card flex flex-col gap-4 p-4 md:p-6"
  >
    <h2 id="seller-spotlight-heading" class="text-label text-muted uppercase">
      {{ t('home.spotlightHeading') }}
    </h2>
    <ErrorState
      v-if="request.status.value === 'error'"
      testid="seller-spotlight-error"
      :title="t('home.sectionErrorTitle')"
      :description="t('home.sectionErrorDescription')"
      :code="request.error.value?.code"
      @retry="request.retry"
    />
    <div v-else-if="request.data.value === null" data-testid="seller-spotlight-skeleton" class="flex flex-col gap-2">
      <SkeletonBlock width="w-1/3" height="h-7" />
      <SkeletonBlock width="w-2/3" />
    </div>
    <template v-else>
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col gap-1">
          <p class="flex items-center gap-2">
            <span data-testid="seller-spotlight-name" class="font-wide text-display text-ink">
              {{ request.data.value.seller.name }}
            </span>
            <SellerTierMark :tier="request.data.value.seller.tier" show-label testid="seller-spotlight-tier" />
          </p>
          <p class="font-mono text-mono text-muted uppercase">
            {{
              t('home.spotlightStats', {
                rating: formatRating(request.data.value.stats.rating),
                sales: formatCount(request.data.value.stats.salesCount),
                onTime: formatPercent(request.data.value.stats.onTimeRate),
              })
            }}
          </p>
          <p class="max-w-prose text-body text-muted">{{ request.data.value.seller.bio }}</p>
        </div>
        <RouterLink
          :to="sellerPath(request.data.value.seller.slug)"
          data-testid="seller-spotlight-link"
          class="btn h-10 shrink-0 self-start border-band bg-surface px-4 text-body text-band hover:bg-action-quiet md:self-auto"
        >
          {{ t('home.spotlightCta') }}
        </RouterLink>
      </div>
      <ProductGrid
        testid="seller-spotlight-products"
        layout="row"
        :status="request.status.value"
        :items="request.data.value.products.items"
        :skeleton-count="4"
      />
    </template>
  </section>
</template>
