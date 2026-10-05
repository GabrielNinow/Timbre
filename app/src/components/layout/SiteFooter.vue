<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { REPORTS_URL, SOURCE_URL } from '@/config'
import { localizePath } from '@/lib/language'

const { t } = useI18n()
const language = usePageLanguage()
/** The public demo runs the API in this browser (ADR 0004), so it says so and offers a reset. */
const isDemo = import.meta.env.VITE_DEMO === '1'

async function reset(): Promise<void> {
  const { resetDemo } = await import('@/api/demo')
  resetDemo()
  window.location.reload()
}
</script>

<template>
  <footer data-testid="site-footer" :data-demo="isDemo ? 'true' : undefined" class="mt-auto bg-band text-on-band">
    <div class="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 md:px-6">
      <p data-testid="footer-notice" class="max-w-prose text-body-sm">{{ isDemo ? t('footer.browserNotice') : t('footer.notice') }}</p>
      <div class="flex flex-wrap items-center gap-4">
        <p data-testid="footer-copyright" class="text-body-sm">{{ t('footer.copyright') }}</p>
        <nav :aria-label="t('footer.linksLabel')" class="flex flex-wrap gap-4">
          <RouterLink data-testid="footer-credits" :to="localizePath('/credits', language)" class="text-body-sm text-on-band underline">{{ t('footer.photoCredits') }}</RouterLink>
          <a data-testid="footer-reports" :href="REPORTS_URL" class="text-body-sm text-on-band underline">{{ t('footer.reports') }}</a>
          <a data-testid="footer-source" :href="SOURCE_URL" class="text-body-sm text-on-band underline">{{ t('footer.source') }}</a>
        </nav>
        <button
          v-if="isDemo"
          type="button"
          data-testid="demo-reset"
          class="btn h-8 border-on-band px-3 text-body-sm text-on-band hover:bg-band-hover focus-visible:outline-on-band"
          @click="reset"
        >
          {{ t('footer.reset') }}
        </button>
      </div>
    </div>
  </footer>
</template>
