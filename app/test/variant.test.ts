import { products } from '@timbre/fixtures'
import { describe, expect, it } from 'vitest'
import {
  buyState,
  clampQuantity,
  defaultOptionId,
  optionQuery,
  selectOption,
} from '@/lib/variant'

type Fixture = (typeof products)[number]
function detail(id: string) {
  const fixture = products.find((product) => product.id === id) as Fixture
  const variants = fixture.variants?.map((group) => ({ label: group.label, options: group.options.map((o) => ({ ...o })) }))
  const stock = variants
    ? variants.flatMap((group) => group.options).reduce((sum, option) => sum + option.stock, 0)
    : (fixture.stock ?? 0)
  return { price: fixture.price, listPrice: fixture.listPrice, stock, variants }
}

const tele = detail('p-0103')

describe('selectOption', () => {
  it('defaults to the first option in stock', () => {
    expect(defaultOptionId(tele)).toBe('v-0103-butterscotch')
    expect(selectOption(tele, undefined)).toBe('v-0103-butterscotch')
  })

  it('honours a known option, including a sold-out one', () => {
    expect(selectOption(tele, 'v-0103-sonic-blue')).toBe('v-0103-sonic-blue')
    expect(selectOption(tele, 'v-0103-black')).toBe('v-0103-black')
    expect(selectOption(tele, ['v-0103-black', 'x'])).toBe('v-0103-black')
  })

  it('falls back to the default for an unknown option', () => {
    expect(selectOption(tele, 'v-9999')).toBe('v-0103-butterscotch')
    expect(selectOption(tele, '')).toBe('v-0103-butterscotch')
  })

  it('returns null for products without variants', () => {
    expect(selectOption(detail('p-0101'), 'v-0103-black')).toBeNull()
  })
})

describe('optionQuery', () => {
  it('writes ?option= for a non-default choice and omits the default', () => {
    expect(optionQuery(tele, 'v-0103-sonic-blue')).toEqual({ option: 'v-0103-sonic-blue' })
    expect(optionQuery(tele, 'v-0103-butterscotch')).toEqual({})
    expect(optionQuery(detail('p-0101'), null)).toEqual({})
  })

  it('round-trips through selectOption', () => {
    for (const id of ['v-0103-butterscotch', 'v-0103-black', 'v-0103-sonic-blue']) {
      expect(selectOption(tele, optionQuery(tele, id).option)).toBe(id)
    }
  })
})

describe('buyState', () => {
  it('adds the option delta to the price and reads stock per option (p-0103)', () => {
    expect(buyState(tele, 'v-0103-butterscotch')).toMatchObject({ unitPrice: 329900, stock: 4, blocked: null, lowStock: false })
    expect(buyState(tele, 'v-0103-sonic-blue')).toMatchObject({ unitPrice: 344900, stock: 2, maxQuantity: 2, lowStock: true })
  })

  it('keeps a sold-out option selectable but blocks buying it with its reason', () => {
    const black = buyState(tele, 'v-0103-black')
    expect(black.option?.name).toBe('Black')
    expect(black.blocked).toBe('sold-out-option')
    expect(black.maxQuantity).toBe(0)
  })

  it('caps the stepper at 1 for the last unit (p-0101)', () => {
    const last = buyState(detail('p-0101'), null)
    expect(last).toMatchObject({ stock: 1, maxQuantity: 1, lowStock: true, blocked: null })
  })

  it('blocks an out-of-stock listing (p-0102)', () => {
    expect(buyState(detail('p-0102'), null)).toMatchObject({ stock: 0, blocked: 'out-of-stock' })
  })

  it('caps plentiful stock at 99 (p-0602)', () => {
    expect(buyState(detail('p-0602'), null)).toMatchObject({ stock: 100, maxQuantity: 99, lowStock: false })
  })

  it('shifts a list price by the option delta', () => {
    const withList = { price: 1000, listPrice: 1500, stock: 2, variants: [{ label: 'X', options: [{ id: 'a', name: 'A', priceDelta: 200, stock: 2 }] }] }
    expect(buyState(withList, 'a')).toMatchObject({ unitPrice: 1200, listPrice: 1700 })
  })
})

describe('clampQuantity', () => {
  it('keeps quantities within 1 and the cap', () => {
    const state = buyState(tele, 'v-0103-sonic-blue')
    expect(clampQuantity(5, state)).toBe(2)
    expect(clampQuantity(0, state)).toBe(1)
    expect(clampQuantity(Number.NaN, state)).toBe(1)
    expect(clampQuantity(2, buyState(tele, 'v-0103-black'))).toBe(1)
  })
})
