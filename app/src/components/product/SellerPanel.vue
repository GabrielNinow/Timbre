<script setup lang="ts">
import type { SellerRef } from '@timbre/contracts'
import { useI18n } from 'vue-i18n'
import SellerTierMark from '@/components/base/SellerTierMark.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { sellerPath } from '@/router/paths'

interface Props {
  seller: SellerRef
}
defineProps<Props>()
const { t } = useI18n()
const language = usePageLanguage()
</script>

<template>
  <section data-testid="seller-panel" :data-seller-id="seller.id" class="card flex flex-col gap-2 p-4" aria-labelledby="seller-panel-heading">
    <h2 id="seller-panel-heading" class="text-label text-muted uppercase">{{ t('sellerPanel.heading') }}</h2>
    <p class="flex flex-wrap items-center gap-2">
      <span data-testid="seller-panel-name" class="text-heading text-ink">{{ seller.name }}</span>
      <SellerTierMark :tier="seller.tier" show-label testid="seller-tier" />
      <span v-if="seller.tier === null" class="text-body-sm text-muted">{{ t('sellerPanel.individual') }}</span>
    </p>
    <p class="font-mono text-mono text-muted uppercase">{{ seller.state }}</p>
    <RouterLink
      :to="sellerPath(seller.slug, language)"
      data-testid="seller-panel-link"
      class="self-start text-body-sm font-semibold text-band underline"
    >
      {{ t('sellerPanel.visit') }}
    </RouterLink>
  </section>
</template>
