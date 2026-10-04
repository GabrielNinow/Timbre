<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CategoryTiles from '@/components/home/CategoryTiles.vue'
import HomeProductSection from '@/components/home/HomeProductSection.vue'
import SellerSpotlight from '@/components/home/SellerSpotlight.vue'
import { HOME_ROW_SIZE } from '@/config'
import { searchRoute } from '@/router/paths'

const { t } = useI18n()
const perPage = String(HOME_ROW_SIZE)
const deals = new URLSearchParams({ onSale: 'true', perPage })
const recent = new URLSearchParams({ sort: 'mais-recentes', perPage })
const sponsored = new URLSearchParams({ sponsored: 'true', perPage })
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
      :see-all-to="searchRoute({ ordem: 'mais-recentes' })"
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
