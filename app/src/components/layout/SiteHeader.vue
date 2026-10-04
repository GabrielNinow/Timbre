<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CategoryMenu from '@/components/layout/CategoryMenu.vue'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { serializeListing, emptyListing } from '@/lib/listing'
import { homePath, searchRoute } from '@/router/paths'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const language = usePageLanguage()

const query = ref('')
watch(
  () => (route.name === 'search' && typeof route.query.q === 'string' ? route.query.q : ''),
  (q) => {
    query.value = q
  },
  { immediate: true },
)

function submit(): void {
  const q = query.value.trim()
  void router.push(searchRoute(language.value, serializeListing({ ...emptyListing(), q: q.length > 0 ? q : null })))
}
</script>

<template>
  <header data-testid="site-header" class="sticky top-0 z-30 bg-band text-on-band">
    <div class="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:flex-nowrap md:px-6">
      <RouterLink
        :to="homePath(language)"
        data-testid="header-home"
        :aria-label="t('header.home')"
        class="font-wide text-display tracking-tight text-on-band uppercase focus-visible:outline-on-band"
      >
        {{ t('app.name') }}
      </RouterLink>
      <form
        role="search"
        data-testid="search-form"
        class="order-last flex w-full min-w-0 md:order-none md:flex-1"
        @submit.prevent="submit"
      >
        <label for="site-search" class="sr-only">{{ t('header.searchLabel') }}</label>
        <input
          id="site-search"
          v-model="query"
          data-testid="search-input"
          type="search"
          name="q"
          autocomplete="off"
          maxlength="120"
          :placeholder="t('header.searchPlaceholder')"
          class="field h-10 min-w-0 flex-1 rounded-r-none border-r-0 px-3"
        >
        <button
          type="submit"
          data-testid="search-submit"
          class="btn h-10 rounded-l-none bg-action px-4 text-body text-on-action hover:bg-action-hover focus-visible:outline-on-band"
        >
          {{ t('header.searchSubmit') }}
        </button>
      </form>
    </div>
    <nav :aria-label="t('header.primaryNav')" class="bg-band-sub">
      <div class="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-1 md:px-6">
        <CategoryMenu />
        <LanguageSwitcher class="ml-auto" />
      </div>
    </nav>
  </header>
</template>
