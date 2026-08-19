<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KsControls from '@/pages/kitchen-sink/KsControls.vue'
import KsDisplay from '@/pages/kitchen-sink/KsDisplay.vue'
import KsOverlays from '@/pages/kitchen-sink/KsOverlays.vue'
import KsTokens from '@/pages/kitchen-sink/KsTokens.vue'

const { t } = useI18n()
const sections = [
  'tokens',
  'button',
  'input',
  'select',
  'checkbox',
  'radio',
  'quantity',
  'dialog',
  'popover',
  'toast',
  'price',
  'spec',
  'badge',
  'tier',
  'stars',
  'skeleton',
  'pagination',
  'empty',
  'error',
] as const
</script>
<template>
  <div class="min-h-dvh bg-field">
    <header class="bg-band">
      <div class="mx-auto flex max-w-[1400px] flex-col gap-1 px-4 py-6 md:px-6">
        <h1 class="font-wide text-display-lg text-on-band">{{ t('kitchenSink.title') }}</h1>
        <p class="text-body text-on-band">{{ t('kitchenSink.subtitle') }}</p>
      </div>
    </header>
    <main id="main" class="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
      <nav :aria-label="t('kitchenSink.tocLabel')" class="card mb-6 p-4">
        <ul class="flex flex-wrap gap-2">
          <li v-for="section in sections" :key="section">
            <a
              :href="`#${section}`"
              data-testid="ks-toc-link"
              :data-section="section"
              class="btn h-8 border-line px-3 text-body-sm text-band hover:bg-sunken"
            >
              {{ t(`kitchenSink.sections.${section}`) }}
            </a>
          </li>
        </ul>
      </nav>
      <div class="flex flex-col gap-6">
        <KsTokens />
        <KsControls />
        <KsOverlays />
        <KsDisplay />
      </div>
    </main>
  </div>
</template>