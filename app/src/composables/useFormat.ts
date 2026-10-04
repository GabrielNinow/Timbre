import { useI18n } from 'vue-i18n'
import * as format from '@/lib/format'
import type { PageLanguage } from '@/lib/language'

/** The formatting helpers bound to the active Page language, reactive to switches. */
export function useFormat() {
  const { locale } = useI18n()
  const language = () => locale.value as PageLanguage
  return {
    formatPrice: (centavos: number) => format.formatPrice(centavos, language()),
    formatPriceShort: (centavos: number) => format.formatPriceShort(centavos, language()),
    splitPrice: (centavos: number) => format.splitPrice(centavos, language()),
    formatRating: (tenths: number) => format.formatRating(tenths, language()),
    formatPercent: (value: number) => format.formatPercent(value, language()),
    formatCount: (value: number) => format.formatCount(value, language()),
    formatMonthYear: (iso: string) => format.formatMonthYear(iso, language()),
  }
}
