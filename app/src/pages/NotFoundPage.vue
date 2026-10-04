<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()
</script>

<template>
  <main id="main" data-testid="not-found" class="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
    <p class="font-mono text-mono text-ink">{{ t('notFound.code') }}</p>
    <h1 class="mt-2 font-wide text-display-lg">{{ t('notFound.title') }}</h1>
    <p class="mt-3 text-body text-ink">{{ t('notFound.description') }}</p>
    <BaseButton testid="not-found-home" variant="outline" :to="{ path: '/' }" class="mt-6">
      {{ t('common.backToHome') }}
    </BaseButton>
  </main>
</template>
