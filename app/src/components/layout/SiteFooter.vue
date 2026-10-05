<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer data-testid="site-footer" class="mt-auto bg-band pt-0 text-on-band">
    <div class="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 md:px-6">
      <p data-testid="footer-notice" class="max-w-prose text-body-sm">{{ t('footer.notice') }}</p>
      <p data-testid="footer-copyright" class="text-body-sm">{{ t('footer.copyright') }}</p>
    </div>
  </footer>
</template>
