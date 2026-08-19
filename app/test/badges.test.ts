import { describe, expect, it } from 'vitest'
import { BADGE_PRIORITY, MAX_BADGES, selectBadges } from '@/lib/badges'

const p0101 = { stock: 1, price: 649900, listPrice: null, freeShipping: true, sponsored: true }
const p0102 = { stock: 0, price: 899900, listPrice: null, freeShipping: false }
const p0104 = { stock: 4, price: 129900, listPrice: 169900, freeShipping: false }
const p0601 = { stock: 12, price: 4990, listPrice: null, freeShipping: true, sponsored: true }

describe('selectBadges', () => {
  it('never returns more than two', () => {
    const everything = { stock: 1, price: 129900, listPrice: 169900, freeShipping: true }
    expect(selectBadges(everything)).toHaveLength(MAX_BADGES)
  })

  it('honours the documented priority', () => {
    const everything = { stock: 0, price: 129900, listPrice: 169900, freeShipping: true }
    expect(selectBadges(everything)).toEqual(['sold-out', 'discount'])
    expect(BADGE_PRIORITY).toEqual(['sold-out', 'last-unit', 'discount', 'free-shipping'])
  })

  it('reads p-0101 as the last unit, with free shipping', () => {
    expect(selectBadges(p0101)).toEqual(['last-unit', 'free-shipping'])
  })

  it('reads p-0102 as sold out and nothing else', () => {
    expect(selectBadges(p0102)).toEqual(['sold-out'])
  })

  it('reads p-0104 as discounted — the -24% card', () => {
    expect(selectBadges(p0104)).toEqual(['discount'])
  })

  it('never shows both sold-out and last-unit', () => {
    for (const stock of [0, 1, 2, 9]) {
      const badges = selectBadges({ ...p0104, stock })
      expect(badges.includes('sold-out') && badges.includes('last-unit')).toBe(false)
    }
  })

  it('returns nothing for an ordinary product', () => {
    expect(selectBadges({ stock: 6, price: 39900, listPrice: null, freeShipping: false })).toEqual(
      [],
    )
  })
})

describe('sponsored', () => {
  it('is silent outside the labelled row, even when the product is flagged', () => {
    expect(selectBadges(p0601)).toEqual(['free-shipping'])
    expect(selectBadges(p0601, { sponsoredRow: false })).toEqual(['free-shipping'])
  })

  it('takes the first slot inside the labelled row — a disclosure outranks good news', () => {
    expect(selectBadges(p0601, { sponsoredRow: true })).toEqual(['sponsored', 'free-shipping'])
    expect(selectBadges(p0101, { sponsoredRow: true })).toEqual(['sponsored', 'last-unit'])
  })

  it('is not shown in the labelled row for a product that is not sponsored', () => {
    expect(selectBadges(p0104, { sponsoredRow: true })).toEqual(['discount'])
  })

  it('still never exceeds two badges', () => {
    const everything = {
      stock: 1,
      price: 129900,
      listPrice: 169900,
      freeShipping: true,
      sponsored: true,
    }
    expect(selectBadges(everything, { sponsoredRow: true })).toEqual(['sponsored', 'last-unit'])
  })
})
