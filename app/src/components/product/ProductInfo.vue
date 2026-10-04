<script setup lang="ts">
import type { ProductDetail } from '@timbre/contracts'
import { useI18n } from 'vue-i18n'
import StarRating from '@/components/base/StarRating.vue'
import { useFormat } from '@/composables/useFormat'

interface Props {
  product: ProductDetail
}
defineProps<Props>()
const { t } = useI18n()
const { formatRating } = useFormat()
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <section data-testid="product-specs" aria-labelledby="specs-heading" class="card p-4">
      <h2 id="specs-heading" class="mb-3 text-heading text-ink">{{ t('product.specsHeading') }}</h2>
      <dl class="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2">
        <template v-for="spec in product.specs" :key="spec.label">
          <dt class="text-body-sm text-muted">{{ spec.label }}</dt>
          <dd data-testid="product-spec" :data-label="spec.label" class="text-body text-ink">{{ spec.value }}</dd>
        </template>
      </dl>
    </section>
    <section data-testid="product-description" aria-labelledby="description-heading" class="card p-4">
      <h2 id="description-heading" class="mb-3 text-heading text-ink">{{ t('product.descriptionHeading') }}</h2>
      <p class="text-body whitespace-pre-line text-ink">{{ product.description }}</p>
    </section>
    <section
      id="reviews"
      data-testid="product-reviews"
      :data-review-count="product.reviewCount"
      aria-labelledby="reviews-heading"
      class="card flex flex-col gap-2 p-4 lg:col-span-2"
    >
      <h2 id="reviews-heading" class="text-heading text-ink">{{ t('product.reviewsHeading') }}</h2>
      <p v-if="product.reviewCount === 0" data-testid="product-reviews-empty" data-state="empty" class="text-body text-muted">
        {{ t('product.reviewsNone') }}
      </p>
      <div v-else class="flex flex-col gap-1">
        <StarRating :rating="product.rating" :show-count="false" size="md" testid="product-reviews-rating" />
        <p class="text-body text-muted">
          {{ t('product.reviewsSummary', { rating: formatRating(product.rating), count: product.reviewCount }, product.reviewCount) }}
        </p>
      </div>
    </section>
  </div>
</template>
