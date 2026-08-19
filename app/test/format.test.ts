import { products } from '@timbre/fixtures'
import { describe, expect, it } from 'vitest'
import { fixedClock } from '@/composables/clock'
import {
  daysSince,
  discountPercent,
  formatCep,
  formatCount,
  formatPercent,
  formatPrice,
  formatRating,
  splitPrice,
} from '@/lib/format'

const NBSP = ' '

describe('formatPrice', () => {
  it('covers the whole fixture range, R$ 39,90 through R$ 8.990,00', () => {
    expect(formatPrice(3990)).toBe(`R$${NBSP}39,90`)
    expect(formatPrice(899000)).toBe(`R$${NBSP}8.990,00`)
  })

  it('always renders two decimal places', () => {
    expect(formatPrice(30000)).toBe(`R$${NBSP}300,00`)
    expect(formatPrice(129900)).toBe(`R$${NBSP}1.299,00`)
    expect(formatPrice(1)).toBe(`R$${NBSP}0,01`)
    expect(formatPrice(0)).toBe(`R$${NBSP}0,00`)
  })

  it('groups thousands with a dot and separates centavos with a comma', () => {
    expect(formatPrice(147480)).toBe(`R$${NBSP}1.474,80`)
    expect(formatPrice(1000000)).toBe(`R$${NBSP}10.000,00`)
  })
})

describe('splitPrice', () => {
  it('splits into the three pieces the price treatment renders separately', () => {
    expect(splitPrice(129990)).toEqual({
      currency: 'R$',
      integer: '1.299',
      decimalSeparator: ',',
      cents: '90',
    })
  })

  it('keeps the cents two digits wide so the row never jitters', () => {
    for (const centavos of [3990, 30000, 129990, 899000, 5, 100]) {
      expect(splitPrice(centavos).cents).toHaveLength(2)
    }
  })

  it('reassembles into exactly what formatPrice produces, for every seeded price', () => {
    for (const product of products) {
      const parts = splitPrice(product.price)
      const rebuilt = `${parts.currency}${NBSP}${parts.integer}${parts.decimalSeparator}${parts.cents}`
      expect(rebuilt).toBe(formatPrice(product.price))
    }
  })
})

describe('discountPercent', () => {
  it('rounds to whole percent — p-0104 is -24%', () => {
    expect(discountPercent(129900, 169900)).toBe(24)
  })

  it('is null when there is no discount to show', () => {
    expect(discountPercent(129900, null)).toBeNull()
    expect(discountPercent(129900, undefined)).toBeNull()
    expect(discountPercent(129900, 129900)).toBeNull()
    expect(discountPercent(129900, 100000)).toBeNull()
  })

  it('agrees with every seeded listPrice', () => {
    const discounted = products.filter((product) => product.listPrice !== null)
    expect(discounted.length).toBeGreaterThan(0)
    for (const product of discounted) {
      const percent = discountPercent(product.price, product.listPrice)
      expect(percent).not.toBeNull()
      expect(percent as number).toBeGreaterThan(0)
      expect(percent as number).toBeLessThan(100)
    }
  })
})

describe('rating, percent and count', () => {
  it('reads integer tenths of a star', () => {
    expect(formatRating(48)).toBe('4,8')
    expect(formatRating(50)).toBe('5,0')
    expect(formatRating(39)).toBe('3,9')
    expect(formatRating(0)).toBe('0,0')
  })

  it('reads integer percent', () => {
    expect(formatPercent(98)).toBe('98%')
    expect(formatPercent(100)).toBe('100%')
  })

  it('groups counts', () => {
    expect(formatCount(89)).toBe('89')
    expect(formatCount(1234)).toBe('1.234')
  })
})

describe('formatCep', () => {
  it('formats eight digits', () => {
    expect(formatCep('89010000')).toBe('89010-000')
    expect(formatCep('89010-000')).toBe('89010-000')
  })

  it('returns anything else untouched, so a half-typed CEP is not mangled', () => {
    expect(formatCep('8901')).toBe('8901')
    expect(formatCep('')).toBe('')
  })
})

describe('daysSince', () => {
  const clock = fixedClock(Date.parse('2026-08-10T12:00:00Z'))

  it('counts whole days against the injected clock, never wall time', () => {
    expect(daysSince('2026-08-07T12:00:00Z', clock.now())).toBe(3)
    expect(daysSince('2026-08-10T11:00:00Z', clock.now())).toBe(0)
  })

  it('never goes negative for a future listing', () => {
    expect(daysSince('2026-09-01T12:00:00Z', clock.now())).toBe(0)
  })

  it('is 0 for an unparseable instant rather than NaN', () => {
    expect(daysSince('not a date', clock.now())).toBe(0)
  })
})
