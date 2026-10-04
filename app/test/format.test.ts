import { products } from '@timbre/fixtures'
import { describe, expect, it } from 'vitest'
import { fixedClock } from '@/composables/clock'
import {
  daysSince,
  discountPercent,
  formatCep,
  formatCount,
  formatPercent,
  formatMonthYear,
  formatPrice,
  formatPriceShort,
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

describe('formatting by Page language', () => {
  it('formats dollars on English pages, the Currency following the Page language', () => {
    expect(formatPrice(25998, 'en')).toBe('$259.98')
    expect(formatPrice(798, 'en')).toBe('$7.98')
    expect(formatPrice(179800, 'en')).toBe('$1,798.00')
  })

  it('formats an explicit BRL amount the English way, for orders charged in reais', () => {
    expect(formatPrice(129990, 'en', 'BRL')).toBe('R$1,299.90')
    expect(formatPrice(129990, 'pt-BR', 'BRL')).toBe(`R$${NBSP}1.299,90`)
  })

  it('keeps the Portuguese default when no language is given', () => {
    expect(formatPrice(129990)).toBe(formatPrice(129990, 'pt-BR'))
  })

  it('formats ratings, counts and percentages per language', () => {
    expect(formatRating(48, 'en')).toBe('4.8')
    expect(formatRating(48, 'pt-BR')).toBe('4,8')
    expect(formatCount(4820, 'en')).toBe('4,820')
    expect(formatCount(4820, 'pt-BR')).toBe('4.820')
    expect(formatPercent(98, 'en')).toBe('98%')
  })

  it('splits prices with the language decimal separator', () => {
    expect(splitPrice(129990, 'en')).toMatchObject({ currency: '$', integer: '1,299', decimalSeparator: '.', cents: '90' })
    expect(splitPrice(129990, 'pt-BR')).toMatchObject({ integer: '1.299', decimalSeparator: ',', cents: '90' })
  })

  it('drops zero cents in short range labels only', () => {
    expect(formatPriceShort(20000, 'pt-BR')).toBe(`R$${NBSP}200`)
    expect(formatPriceShort(4000, 'en')).toBe('$40')
    expect(formatPriceShort(4050, 'en')).toBe('$40.50')
  })
})

describe('formatMonthYear', () => {
  it('formats in UTC by Page language', () => {
    expect(formatMonthYear('2019-03-12T00:00:00Z', 'en')).toBe('March 2019')
    expect(formatMonthYear('2019-03-12T00:00:00Z', 'pt-BR')).toBe('março de 2019')
    expect(formatMonthYear('2019-03-01T00:00:00Z', 'en')).toBe('March 2019')
  })
})

