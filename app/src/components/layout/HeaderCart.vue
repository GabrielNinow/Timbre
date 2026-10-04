<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { localizePath } from '@/lib/language'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const language = usePageLanguage()
const cart = useCartStore()
</script>

<template>
  <RouterLink
    :to="localizePath('/cart', language)"
    data-testid="header-cart"
    class="btn h-10 shrink-0 gap-2 px-3 text-body text-on-band hover:bg-band-hover focus-visible:outline-on-band"
  >
    {{ t('headerCart.label') }}
    <span
      data-testid="cart-count"
      :data-count="cart.count"
      aria-live="polite"
      class="inline-flex min-w-6 items-center justify-center rounded-full bg-action px-1.5 text-body-sm font-semibold text-on-action"
    >
      <span aria-hidden="true">{{ cart.count }}</span>
      <span class="sr-only">{{ t('headerCart.count', { count: cart.count }, cart.count) }}</span>
    </span>
  </RouterLink>
</template>
