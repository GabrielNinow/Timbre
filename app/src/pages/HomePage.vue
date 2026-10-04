<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CategoryTiles from '@/components/home/CategoryTiles.vue'
import HomeProductSection from '@/components/home/HomeProductSection.vue'
import SellerSpotlight from '@/components/home/SellerSpotlight.vue'
import { HOME_ROW_SIZE } from '@/config'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { currencyFor } from '@/lib/language'
import { searchRoute } from '@/router/paths'

const { t } = useI18n()
const language = usePageLanguage()
const perPage = String(HOME_ROW_SIZE)
const withCurrency = (params: Record<string, string>) =>
  computed(() => new URLSearchParams({ ...params, perPage, currency: currencyFor(language.value) }))
const deals = withCurrency({ onSale: 'true' })
const recent = withCurrency({ sort: 'newest' })
const sponsored = withCurrency({ sponsored: 'true' })
</script>

<template>
  <main id="main" data-testid="home-page" class="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-4 py-6 md:px-6">
    <h1 class="sr-only">{{ t('home.title') }}</h1>
    <CategoryTiles />
    <HomeProductSection testid="home-deals" :heading="t('home.dealsHeading')" :params="deals" />
    <HomeProductSection
      testid="home-recent"
      :heading="t('home.newHeading')"
      :params="recent"
      :see-all-to="searchRoute(language, { sort: 'newest' })"
    />
    <HomeProductSection
      testid="home-sponsored"
      :heading="t('home.sponsoredHeading')"
      :note="t('home.sponsoredNote')"
      :params="sponsored"
      sponsored-row
    />
    <SellerSpotlight />
  </main>
</template>
