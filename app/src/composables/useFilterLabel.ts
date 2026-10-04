import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/lib/format'
import type { ListingFilter, PriceRange } from '@/lib/listing'
import { useCatalogStore } from '@/stores/catalog'

/** Human label for an active filter, shared by the chips and the empty state. */
export function useFilterLabel(): (filter: ListingFilter) => string {
  const { t } = useI18n()
  const catalog = useCatalogStore()

  function priceLabel(range: PriceRange): string {
    if (range.max === null) return t('listing.priceFrom', { min: formatPrice(range.min) })
    if (range.min === 0) return t('listing.priceUpTo', { max: formatPrice(range.max) })
    return t('listing.priceRange', { min: formatPrice(range.min), max: formatPrice(range.max) })
  }

  return (filter) => {
    switch (filter.facet) {
      case 'category':
        return catalog.bySlug.get(filter.value)?.name ?? filter.value
      case 'brand':
        return filter.value
      case 'condition':
        return t(`condition.${filter.value}`)
      case 'price':
        return priceLabel(filter.value)
      case 'freeShipping':
        return t('badge.freeShipping')
    }
  }
}
