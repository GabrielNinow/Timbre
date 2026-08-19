const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const decimal1 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
export function formatPrice(centavos: number): string {
  return brl.format(centavos / 100)
}

export interface PriceParts {
  currency: string
  integer: string
  decimalSeparator: string
  cents: string
}
export function splitPrice(centavos: number): PriceParts {
  const parts = brl.formatToParts(centavos / 100)
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

export function formatRating(tenths: number): string {
  return decimal1.format(tenths / 10)
}
export function formatPercent(value: number): string {
  return `${integer.format(value)}%`
}
export function formatCount(value: number): string {
  return integer.format(value)
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