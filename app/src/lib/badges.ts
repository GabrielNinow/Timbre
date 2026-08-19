import { discountPercent } from '@/lib/format'
export type BadgeKind = 'sold-out' | 'last-unit' | 'discount' | 'free-shipping' | 'sponsored'
export const BADGE_PRIORITY: readonly BadgeKind[] = [
  'sold-out',
  'last-unit',
  'discount',
  'free-shipping',
]
export const MAX_BADGES = 2
export interface BadgeInput {
  stock: number
  price: number
  listPrice?: number | null
  freeShipping: boolean
  sponsored?: boolean
}
export interface BadgeOptions {
  sponsoredRow?: boolean
}
export function selectBadges(input: BadgeInput, options: BadgeOptions = {}): BadgeKind[] {
  const badges: BadgeKind[] = []

  if (options.sponsoredRow === true && input.sponsored === true) {
    badges.push('sponsored')
  }
  const earned = new Set<BadgeKind>()
  if (input.stock === 0) earned.add('sold-out')
  else if (input.stock === 1) earned.add('last-unit')
  if (discountPercent(input.price, input.listPrice) !== null) earned.add('discount')
  if (input.freeShipping) earned.add('free-shipping')
  for (const kind of BADGE_PRIORITY) {
    if (badges.length >= MAX_BADGES) break
    if (earned.has(kind)) badges.push(kind)
  }
  return badges
}