import { cardBrandOf, cvvLengthFor, luhnValid, normalizeCardNumber, type CardBrand } from '@timbre/contracts'

/**
 * Card entry helpers for the payment step. Brand detection, Luhn and CVV length
 * come from `packages/contracts`, so the client and the API agree on every card.
 */

export { luhnValid }

export function cardBrand(number: string): CardBrand {
  return cardBrandOf(number)
}

export function cvvLength(number: string): number {
  return cvvLengthFor(cardBrandOf(number))
}

/** Live formatting while typing: 4-6-5 for Amex, groups of four otherwise. */
export function formatCardNumber(raw: string): string {
  const digits = normalizeCardNumber(raw).replace(/\D/g, '').slice(0, 19)
  if (cardBrandOf(digits) === 'amex') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ')
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Live formatting while typing: MM/YY, with a lone first digit above 1 padded to 0X. */
export function formatExpiry(raw: string): string {
  let digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

/** True when MM/YY is before the month of `nowMs` (UTC). Read from the injected clock. */
export function expiryInPast(expiry: string, nowMs: number): boolean {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry)
  if (!match) return false
  const now = new Date(nowMs)
  const year = 2000 + Number(match[2])
  const month = Number(match[1])
  return year < now.getUTCFullYear() || (year === now.getUTCFullYear() && month < now.getUTCMonth() + 1)
}
