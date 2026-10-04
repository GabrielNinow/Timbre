<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { PAGE_LANGUAGES } from '@/lib/language'
import { switchLanguagePath } from '@/lib/listing'

const { t } = useI18n()
const route = useRoute()
const current = usePageLanguage()

/** Same page, same filters, other language. */
const options = computed(() =>
  PAGE_LANGUAGES.map((language) => ({
    language,
    to: switchLanguagePath(route.fullPath, language),
    active: language === current.value,
  })),
)
</script>

<template>
  <nav data-testid="language-switcher" :data-language="current" :aria-label="t('language.label')">
    <ul class="flex items-center gap-1">
      <li v-for="option in options" :key="option.language">
        <RouterLink
          :to="option.to"
          data-testid="language-option"
          :data-language="option.language"
          :lang="option.language"
          :hreflang="option.language"
          :aria-current="option.active ? 'true' : undefined"
          :aria-label="`${t(`language.short.${option.language}`)}, ${t(`language.names.${option.language}`)}`"
          class="btn h-8 px-2 text-body-sm text-on-band hover:bg-band-hover focus-visible:outline-on-band aria-[current=true]:bg-band-hover aria-[current=true]:underline"
        >
          {{ t(`language.short.${option.language}`) }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
