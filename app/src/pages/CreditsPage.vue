<script setup lang="ts">
import { photoCredits } from '@timbre/fixtures/photo-credits'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchProducts } from '@/api/catalog'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { useRequest } from '@/composables/useRequest'
import { assetUrl } from '@/lib/assets'
import { productPath } from '@/router/paths'

const { t } = useI18n()
const language = usePageLanguage()
const params = new URLSearchParams({ perPage: '60', sort: 'relevance' })
const request = useRequest(() => 'credits', (signal) => fetchProducts(params, { signal }))
const rows = computed(() =>
  [...(request.data.value?.items ?? [])]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((product) => ({ product, credit: photoCredits[product.id] ?? null })),
)
</script>

<template>
  <main id="main" data-testid="credits-page" :data-state="request.status.value" class="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-8 md:px-6">
    <header class="flex flex-col gap-2">
      <h1 class="font-wide text-display-lg text-ink">{{ t('credits.title') }}</h1>
      <p class="max-w-prose text-body text-ink">{{ t('credits.lead') }}</p>
    </header>
    <ErrorState v-if="request.status.value === 'error'" testid="credits-error" :code="request.error.value?.code" @retry="request.retry" />
    <SkeletonBlock v-else-if="request.data.value === null" height="h-96" rounded="card" />
    <ul v-else data-testid="credits-list" class="card divide-y divide-line">
      <li v-for="row in rows" :key="row.product.id" data-testid="credit-row" :data-product-id="row.product.id" class="flex gap-4 p-4">
        <img :src="assetUrl(row.product.imageUrl)" alt="" width="72" height="72" loading="lazy" class="size-18 shrink-0 rounded-control border border-line bg-surface object-contain">
        <div class="flex min-w-0 flex-col gap-1">
          <RouterLink :to="productPath(row.product, language)" class="text-body font-semibold text-ink hover:underline">{{ row.product.name }}</RouterLink>
          <template v-if="row.credit">
            <p class="text-body-sm text-ink">
              {{ t('credits.photo') }}: <a :href="row.credit.source" class="underline">{{ row.credit.title }}</a>
            </p>
            <p class="text-body-sm text-muted">
              {{ t('credits.author') }}: {{ row.credit.author }} ·
              {{ t('credits.license') }}:
              <a v-if="row.credit.licenseUrl" :href="row.credit.licenseUrl" class="underline">{{ row.credit.license }}</a>
              <template v-else>{{ row.credit.license }}</template>
            </p>
          </template>
          <p v-else class="text-body-sm text-muted">{{ t('credits.none') }}</p>
        </div>
      </li>
    </ul>
  </main>
</template>
