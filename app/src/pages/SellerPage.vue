<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { fetchSeller } from '@/api/catalog'
import ErrorState from '@/components/base/ErrorState.vue'
import SellerTierMark from '@/components/base/SellerTierMark.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ListingView from '@/components/catalog/ListingView.vue'
import { useFormat } from '@/composables/useFormat'
import { useRequest } from '@/composables/useRequest'
import NotFoundPage from '@/pages/NotFoundPage.vue'

const { t } = useI18n()
const route = useRoute()
const { formatCount, formatPercent, formatRating, formatMonthYear } = useFormat()

const slug = computed(() => String(route.params.sellerSlug))
/** The profile only; listings come through the catalog so they get facets and filters. */
const request = useRequest(
  () => slug.value,
  (signal) => fetchSeller(slug.value, new URLSearchParams({ perPage: '1' }), { signal }),
)
const seller = computed(() => request.data.value?.seller ?? null)
const stats = computed(() => request.data.value?.stats ?? null)
const notFound = computed(() => request.error.value?.code === 'NOT_FOUND')
</script>

<template>
  <NotFoundPage v-if="notFound" />
  <main
    v-else
    id="main"
    data-testid="seller-page"
    :data-seller-slug="slug"
    :data-state="request.status.value"
    class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6"
  >
    <ErrorState
      v-if="request.status.value === 'error'"
      testid="seller-error"
      :title="t('sellerPage.errorTitle')"
      :code="request.error.value?.code"
      @retry="request.retry"
    />
    <div v-else-if="!seller || !stats" data-testid="seller-skeleton" data-state="loading" role="status" :aria-label="t('sellerPage.loading')" class="card flex flex-col gap-3 p-6">
      <SkeletonBlock width="w-1/3" height="h-8" />
      <SkeletonBlock width="w-2/3" />
    </div>
    <template v-else>
      <header data-testid="seller-profile" :data-seller-id="seller.id" class="card flex flex-col gap-4 p-6">
        <div class="flex flex-wrap items-center gap-3">
          <h1 data-testid="seller-name" class="font-wide text-display-lg text-ink">{{ seller.name }}</h1>
          <SellerTierMark :tier="seller.tier" show-label testid="seller-tier" />
        </div>
        <p class="text-body text-muted">
          {{ t('sellerPage.memberSince', { date: formatMonthYear(stats.memberSince) }) }} · {{ seller.state }}
        </p>
        <dl class="flex flex-wrap gap-8">
          <div>
            <dt class="text-label text-muted uppercase">{{ t('sellerPage.rating') }}</dt>
            <dd data-testid="seller-stat-rating" :data-value="stats.rating" class="text-heading text-ink">{{ formatRating(stats.rating) }}</dd>
          </div>
          <div>
            <dt class="text-label text-muted uppercase">{{ t('sellerPage.sales') }}</dt>
            <dd data-testid="seller-stat-sales" :data-value="stats.salesCount" class="text-heading text-ink">{{ formatCount(stats.salesCount) }}</dd>
          </div>
          <div>
            <dt class="text-label text-muted uppercase">{{ t('sellerPage.onTime') }}</dt>
            <dd data-testid="seller-stat-on-time" :data-value="stats.onTimeRate" class="text-heading text-ink">{{ formatPercent(stats.onTimeRate) }}</dd>
          </div>
        </dl>
        <section aria-labelledby="seller-about">
          <h2 id="seller-about" class="sr-only">{{ t('sellerPage.aboutHeading') }}</h2>
          <p data-testid="seller-bio" class="max-w-prose text-body text-ink">{{ seller.bio }}</p>
        </section>
      </header>
      <ListingView :context="{ pinnedSellerId: seller.id }" :heading="t('sellerPage.listingsHeading')" />
    </template>
  </main>
</template>
