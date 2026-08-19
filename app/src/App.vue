<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseToast from '@/components/base/BaseToast.vue'

const { t } = useI18n()
</script>

<template>
  <a
    href="#main"
    data-testid="skip-to-content"
    class="btn sr-only bg-action px-4 py-2 text-body text-on-action focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
  >
    {{ t('a11y.skipToContent') }}
  </a>

  <RouterView />

  <BaseToast />
</template>
