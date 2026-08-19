<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BadgeChip from '@/components/base/BadgeChip.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import Pagination from '@/components/base/Pagination.vue'
import PriceDisplay from '@/components/base/PriceDisplay.vue'
import SellerTierMark from '@/components/base/SellerTierMark.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import SpecStrip from '@/components/base/SpecStrip.vue'
import StarRating from '@/components/base/StarRating.vue'
import type { BadgeKind } from '@/lib/badges'
import KsRow from '@/pages/kitchen-sink/KsRow.vue'
import KsSection from '@/pages/kitchen-sink/KsSection.vue'

const { t } = useI18n()

const page = ref(4)
const shortPage = ref(2)

const badges: readonly BadgeKind[] = ['free-shipping', 'discount', 'last-unit', 'sold-out', 'sponsored']
</script>

<template>
  <KsSection id="price" :title="t('kitchenSink.sections.price')">
    <KsRow :label="t('kitchenSink.price.cheapest')">
      <PriceDisplay :price="3990" testid="ks-price-cheapest" />
      <PriceDisplay :price="39900" testid="ks-price-mid" />
      <PriceDisplay :price="899000" testid="ks-price-expensive" />
    </KsRow>
    <KsRow :label="t('kitchenSink.price.discounted')">
      <PriceDisplay :price="129900" :list-price="169900" testid="ks-price-discounted" />
      <PriceDisplay :price="649900" :list-price="799900" testid="ks-price-discounted-lg" />
    </KsRow>
  </KsSection>

  <KsSection id="spec" :title="t('kitchenSink.sections.spec')">
    <KsRow :label="t('kitchenSink.spec.full')" stacked>
      <SpecStrip :year="2019" condition="seminovo" state="SP" tier="PLATINA" />
      <SpecStrip :year="2023" condition="novo" state="RJ" tier="OURO" />
      <SpecStrip condition="usado" state="MG" />
    </KsRow>
  </KsSection>

  <KsSection id="badge" :title="t('kitchenSink.sections.badge')">
    <KsRow :label="t('kitchenSink.states.default')">
      <BadgeChip v-for="kind in badges" :key="kind" :kind="kind" :percent="18" />
    </KsRow>
  </KsSection>

  <KsSection id="tier" :title="t('kitchenSink.sections.tier')">
    <KsRow :label="t('kitchenSink.states.default')">
      <SellerTierMark tier="PRATA" show-label />
      <SellerTierMark tier="OURO" show-label />
      <SellerTierMark tier="PLATINA" show-label />
      <SellerTierMark tier="PLATINA" />
      <SellerTierMark :tier="null" />
    </KsRow>
  </KsSection>

  <KsSection id="stars" :title="t('kitchenSink.sections.stars')">
    <KsRow :label="t('kitchenSink.states.default')" stacked>
      <StarRating :rating="48" :review-count="132" />
      <StarRating :rating="39" :review-count="3" />
      <StarRating :rating="50" :review-count="1" size="md" />
    </KsRow>
    <KsRow :label="t('kitchenSink.states.empty')">
      <StarRating :rating="0" :review-count="0" />
    </KsRow>
  </KsSection>

  <KsSection id="skeleton" :title="t('kitchenSink.sections.skeleton')">
    <KsRow :label="t('kitchenSink.states.loading')">
      <div
        v-for="index in 3"
        :key="index"
        class="card flex w-44 flex-col gap-2 p-3"
        data-state="loading"
      >
        <SkeletonBlock height="h-32" rounded="card" />
        <SkeletonBlock width="w-16" height="h-3" />
        <SkeletonBlock width="w-24" height="h-6" />
        <SkeletonBlock height="h-3" />
      </div>
    </KsRow>
  </KsSection>

  <KsSection id="pagination" :title="t('kitchenSink.sections.pagination')">
    <KsRow :label="t('kitchenSink.pagination.middlePage')" stacked>
      <Pagination v-model:page="page" :page-count="12" />
    </KsRow>
    <KsRow :label="t('kitchenSink.pagination.fewPages')" stacked>
      <Pagination v-model:page="shortPage" :page-count="3" testid="ks-pagination-short" />
    </KsRow>
    <KsRow :label="t('kitchenSink.states.disabled')" stacked>
      <Pagination :page="1" :page-count="12" testid="ks-pagination-disabled" disabled />
    </KsRow>
  </KsSection>

  <KsSection id="empty" :title="t('kitchenSink.sections.empty')">
    <KsRow :label="t('kitchenSink.states.empty')" stacked>
      <EmptyState
        testid="results-empty"
        :title="t('kitchenSink.empty.title')"
        :description="t('kitchenSink.empty.description')"
      >
        <template #action>
          <BaseButton testid="filter-clear-all" variant="outline">
            {{ t('kitchenSink.empty.action') }}
          </BaseButton>
        </template>
      </EmptyState>
    </KsRow>
  </KsSection>

  <KsSection id="error" :title="t('kitchenSink.sections.error')">
    <KsRow :label="t('kitchenSink.states.error')" stacked>
      <ErrorState
        testid="results-error"
        :title="t('kitchenSink.error.title')"
        :description="t('kitchenSink.error.description')"
        code="INTERNAL_ERROR"
      />
    </KsRow>
    <KsRow :label="t('kitchenSink.states.loading')" stacked>
      <ErrorState testid="ks-error-retrying" code="INJECTED_FAILURE" retrying />
    </KsRow>
  </KsSection>
</template>
