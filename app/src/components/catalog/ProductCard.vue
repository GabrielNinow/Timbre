<script setup lang="ts">
import type { ProductSummary } from '@timbre/contracts'
import { computed } from 'vue'
import BadgeChip from '@/components/base/BadgeChip.vue'
import PriceDisplay from '@/components/base/PriceDisplay.vue'
import SpecStrip from '@/components/base/SpecStrip.vue'
import StarRating from '@/components/base/StarRating.vue'
import { selectBadges } from '@/lib/badges'
import { discountPercent } from '@/lib/format'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { productPath } from '@/router/paths'

interface Props {
  product: ProductSummary
  /** Only the home page's labelled sponsored row passes this. */
  sponsoredRow?: boolean
}
const props = withDefaults(defineProps<Props>(), { sponsoredRow: false })
const language = usePageLanguage()

const badges = computed(() =>
  selectBadges(props.product, { sponsoredRow: props.sponsoredRow }),
)
const percent = computed(
  () => discountPercent(props.product.price, props.product.listPrice) ?? undefined,
)
const stockState = computed(() => {
  if (props.product.stock === 0) return 'sold-out'
  return props.product.stock <= 3 ? 'low' : 'in-stock'
})
</script>

<template>
  <article
    data-testid="product-card"
    :data-product-id="product.id"
    :data-stock-state="stockState"
    :data-sponsored="sponsoredRow ? 'true' : undefined"
    class="card group relative flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-150 ease-out hover:border-line-heavy has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-band hover:shadow-lift"
    :class="sponsoredRow ? 'border-line-heavy' : ''"
  >
    <div
      class="aspect-square border-b border-line bg-surface p-3"
      :class="stockState === 'sold-out' ? 'opacity-60' : ''"
    >
      <img
        :src="product.imageUrl"
        alt=""
        width="320"
        height="320"
        loading="lazy"
        decoding="async"
        class="size-full object-contain"
      >
    </div>
    <div class="flex flex-1 flex-col gap-2 p-3">
      <div v-if="badges.length > 0" class="flex flex-wrap gap-1">
        <BadgeChip
          v-for="kind in badges"
          :key="kind"
          :kind="kind"
          :percent="percent"
          testid="product-card-badge"
        />
      </div>
      <PriceDisplay
        :price="product.price"
        :list-price="product.listPrice"
        testid="product-card-price"
      />
      <SpecStrip
        :year="product.year"
        :condition="product.condition"
        :state="product.seller.state"
        :tier="product.seller.tier"
        testid="product-card-spec-strip"
      />
      <h3 class="line-clamp-2 text-body text-ink">
        <RouterLink
          :to="productPath(product, language)"
          data-testid="product-card-title"
          class="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
        >
          {{ product.name }}
        </RouterLink>
      </h3>
      <StarRating
        class="mt-auto flex-wrap gap-y-1"
        :rating="product.rating"
        :review-count="product.reviewCount"
        testid="product-card-rating"
      />
    </div>
  </article>
</template>
