import { DEFAULT_LANGUAGE, type PageLanguage } from '@/lib/language'

/** Formatting follows the Page language. Money stays BRL until milestone 3.3. */
const cache = new Map<string, Intl.NumberFormat>()
function formatter(language: PageLanguage, kind: 'money' | 'money-whole' | 'decimal1' | 'integer') {
  const key = `${language}:${kind}`
  let found = cache.get(key)
  if (!found) {
    const options: Record<typeof kind, Intl.NumberFormatOptions> = {
      money: { style: 'currency', currency: 'BRL' },
      'money-whole': { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, minimumFractionDigits: 0 },
      decimal1: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      integer: { maximumFractionDigits: 0 },
    }
    found = new Intl.NumberFormat(language, options[kind])
    cache.set(key, found)
  }
  return found
}

export function formatPrice(centavos: number, language: PageLanguage = DEFAULT_LANGUAGE): string {
  return formatter(language, 'money').format(centavos / 100)
}

/** Drops the cents when they are zero: R$ 200 rather than R$ 200,00. For range labels. */
export function formatPriceShort(centavos: number, language: PageLanguage = DEFAULT_LANGUAGE): string {
  return centavos % 100 === 0
    ? formatter(language, 'money-whole').format(centavos / 100)
    : formatPrice(centavos, language)
}

export interface PriceParts {
  currency: string
  integer: string
  decimalSeparator: string
  cents: string
}
export function splitPrice(centavos: number, language: PageLanguage = DEFAULT_LANGUAGE): PriceParts {
  const parts = formatter(language, 'money').formatToParts(centavos / 100)
  let currency = ''
  let integerPart = ''
  let decimalSeparator = ','
  let cents = ''
  for (const part of parts) {
    switch (part.type) {
      case 'currency':
        currency = part.value
        break
      case 'integer':
      case 'group':
        integerPart += part.value
        break
      case 'decimal':
        decimalSeparator = part.value
        break
      case 'fraction':
        cents = part.value
        break
      case 'minusSign':
        integerPart = part.value + integerPart
        break
      default:
        break
    }
  }
  return { currency, integer: integerPart, decimalSeparator, cents }
}
export function discountPercent(price: number, listPrice: number | null | undefined): number | null {
  if (listPrice == null || listPrice <= price) return null
  const percent = Math.round((1 - price / listPrice) * 100)
  return percent > 0 ? percent : null
}

export function formatRating(tenths: number, language: PageLanguage = DEFAULT_LANGUAGE): string {
  return formatter(language, 'decimal1').format(tenths / 10)
}
export function formatPercent(value: number, language: PageLanguage = DEFAULT_LANGUAGE): string {
  return `${formatter(language, 'integer').format(value)}%`
}
export function formatCount(value: number, language: PageLanguage = DEFAULT_LANGUAGE): string {
  return formatter(language, 'integer').format(value)
}
export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return cep
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
const DAY_MS = 86_400_000
export function daysSince(iso: string, nowMs: number): number {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.floor((nowMs - then) / DAY_MS))
}