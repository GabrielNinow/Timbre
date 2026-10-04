import { useI18n } from 'vue-i18n'
import { useFormat } from '@/composables/useFormat'
import type { ListingFilter, PriceRange } from '@/lib/listing'

/** Price ranges as Platform copy: shared by the bucket list, the chips and the empty state. */
export function usePriceLabel(): (range: PriceRange) => string {
  const { t } = useI18n()
  const { formatPriceShort } = useFormat()
  return (range) => {
    if (range.max === null) return t('listing.priceFrom', { min: formatPriceShort(range.min) })
    if (range.min === 0) return t('listing.priceUpTo', { max: formatPriceShort(range.max) })
    return t('listing.priceRange', { min: formatPriceShort(range.min), max: formatPriceShort(range.max) })
  }
}

/** Human label for an active filter, shared by the chips and the empty state. */
export function useFilterLabel(): (filter: ListingFilter) => string {
  const { t } = useI18n()
  const priceLabel = usePriceLabel()

  return (filter) => {
    switch (filter.facet) {
      case 'category':
        return t(`category.${filter.value}`)
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
