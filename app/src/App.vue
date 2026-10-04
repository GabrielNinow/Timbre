<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseToast from '@/components/base/BaseToast.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { currencyFor } from '@/lib/language'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const cart = useCartStore()
const language = usePageLanguage()
// The cart follows the Page language's Currency: switching language refetches it.
watch(() => currencyFor(language.value), (currency) => void cart.load(currency), { immediate: true })
</script>

<template>
  <a
    href="#main"
    data-testid="skip-to-content"
    class="btn sr-only bg-action px-4 py-2 text-body text-on-action focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
  >
    {{ t('a11y.skipToContent') }}
  </a>

  <SiteHeader />

  <RouterView />

  <BaseToast />
</template>
