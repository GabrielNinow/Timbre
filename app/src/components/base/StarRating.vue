<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatRating } from '@/lib/format'

interface Props {
  rating: number
  reviewCount?: number
  size?: 'sm' | 'md'
  showCount?: boolean
  testid?: string
}
const props = withDefaults(defineProps<Props>(), {
  reviewCount: undefined,
  size: 'sm',
  showCount: true,
  testid: 'star-rating',
})
const { t } = useI18n()
const STARS = 5
const MAX_TENTHS = 50

const STAR_PATH =
  'M12 2.2 14.7 8.48 21.51 9.11 16.37 13.62 17.88 20.29 12 16.8 6.12 20.29 7.63 13.62 2.49 9.11 9.3 8.48Z'

const sizes: Record<NonNullable<Props['size']>, { star: string; text: string }> = {
  sm: { star: 'size-3', text: 'text-body-sm' },
  md: { star: 'size-4', text: 'text-body' },
}
const fillPercent = computed(() => Math.min(Math.max(props.rating, 0), MAX_TENTHS) * 2)

const noReviews = computed(() => props.reviewCount === 0)
const countLabel = computed(() =>
  props.reviewCount === undefined
    ? null
    : t('rating.reviews', { count: props.reviewCount }, props.reviewCount),
)
const spoken = computed(() => {
  const value = t('rating.value', { value: formatRating(props.rating) })
  return countLabel.value === null ? value : `${value}, ${countLabel.value}`
})
</script>
<template>
  <span
    :data-testid="testid"
    :data-rating="rating"
    :data-review-count="reviewCount"
    class="inline-flex items-center"
    :class="noReviews ? 'text-body-sm text-muted' : 'gap-2'"
  >
    <template v-if="noReviews">{{ t('rating.none') }}</template>
    <template v-else>
      <span class="relative inline-flex shrink-0" aria-hidden="true">
        <span class="inline-flex text-line-heavy">
          <svg
            v-for="index in STARS"
            :key="index"
            :class="sizes[size].star"
            class="shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path :d="STAR_PATH" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
        </span>
        <span
          class="absolute inset-y-0 left-0 flex overflow-hidden text-star"
          :style="{ width: `${fillPercent}%` }"
        >
          <svg
            v-for="index in STARS"
            :key="index"
            :class="sizes[size].star"
            class="shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              :d="STAR_PATH"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </span>
      <span aria-hidden="true" :class="sizes[size].text" class="font-semibold text-ink">
        {{ formatRating(rating) }}
      </span>

      <span
        v-if="showCount && countLabel !== null"
        :data-testid="`${testid}-count`"
        aria-hidden="true"
        :class="sizes[size].text"
        class="text-muted"
      >
        {{ countLabel }}
      </span>
      <span class="sr-only">{{ spoken }}</span>
    </template>
  </span>
</template>