import { DEFAULT_LANGUAGE, currencyFor, type PageCurrency, type PageLanguage } from '@/lib/language'

/** Numbers format by Page language; money is in the page's Currency unless told otherwise. */
const cache = new Map<string, Intl.NumberFormat>()
function formatter(
  language: PageLanguage,
  kind: 'money' | 'money-whole' | 'decimal1' | 'integer',
  currency: PageCurrency = currencyFor(language),
) {
  const key = `${language}:${kind}:${currency}`
  let found = cache.get(key)
  if (!found) {
    const options: Record<typeof kind, Intl.NumberFormatOptions> = {
      money: { style: 'currency', currency },
      'money-whole': { style: 'currency', currency, maximumFractionDigits: 0, minimumFractionDigits: 0 },
      decimal1: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      integer: { maximumFractionDigits: 0 },
    }
    found = new Intl.NumberFormat(language, options[kind])
    cache.set(key, found)
  }
  return found
}

/** `cents` of `currency`, which defaults to the Page language's Currency. */
export function formatPrice(
  cents: number,
  language: PageLanguage = DEFAULT_LANGUAGE,
  currency: PageCurrency = currencyFor(language),
): string {
  return formatter(language, 'money', currency).format(cents / 100)
}

/** Drops the cents when they are zero: R$ 200 rather than R$ 200,00. For range labels. */
export function formatPriceShort(
  cents: number,
  language: PageLanguage = DEFAULT_LANGUAGE,
  currency: PageCurrency = currencyFor(language),
): string {
  return cents % 100 === 0
    ? formatter(language, 'money-whole', currency).format(cents / 100)
    : formatPrice(cents, language, currency)
}

export interface PriceParts {
  currency: string
  integer: string
  decimalSeparator: string
  cents: string
}
export function splitPrice(
  amount: number,
  language: PageLanguage = DEFAULT_LANGUAGE,
  moneyCurrency: PageCurrency = currencyFor(language),
): PriceParts {
  const parts = formatter(language, 'money', moneyCurrency).formatToParts(amount / 100)
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