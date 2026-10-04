import type { Category } from '@timbre/contracts'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { fetchCategories } from '@/api/catalog'
import type { ApiError } from '@/api/client'
import type { RequestStatus } from '@/composables/useRequest'

/** Categories change only on a store reset, so they load once and are shared. */
export const useCatalogStore = defineStore('catalog', () => {
  const categories = shallowRef<Category[]>([])
  const status = shallowRef<RequestStatus | 'idle'>('idle')
  const error = shallowRef<ApiError | null>(null)
  let inflight: Promise<void> | null = null

  function loadCategories(force = false): Promise<void> {
    if (!force && (status.value === 'ready' || inflight)) return inflight ?? Promise.resolve()
    status.value = 'loading'
    error.value = null
    inflight = fetchCategories()
      .then((list) => {
        categories.value = list.items
        status.value = 'ready'
      })
      .catch((caught: ApiError) => {
        error.value = caught
        status.value = 'error'
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  const bySlug = computed(() => new Map(categories.value.map((category) => [category.slug, category])))
  const byId = computed(() => new Map(categories.value.map((category) => [category.id, category])))

  return { categories, status, error, loadCategories, bySlug, byId }
})
