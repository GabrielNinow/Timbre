import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import { languageOfPath, type PageLanguage } from '@/lib/language'

export function usePageLanguage(): ComputedRef<PageLanguage> {
  const route = useRoute()
  return computed(() => languageOfPath(route.path))
}
