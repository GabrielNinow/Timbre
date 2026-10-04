import { PRICE_BUCKETS, productListQuerySchema } from '@timbre/contracts'
import { describe, expect, it } from 'vitest'
import {
  activeFilters,
  clearFilters,
  emptyListing,
  goToPage,
  parseListing,
  parsePrice,
  priceFromInputs,
  removeFilter,
  serializeListing,
  toApiParams,
  toggleBrand,
  toggleCondition,
  updateListing,
  type ListingState,
} from '@/lib/listing'

const full: ListingState = {
  q: 'stratocaster',
  category: 'guitarras',
  brands: ['Fender', 'Gibson'],
  conditions: ['novo', 'usado'],
  price: { min: 20000, max: 50000 },
  freeShipping: true,
  sort: 'menor-preco',
  page: 3,
}

describe('parseListing and serializeListing', () => {
  it('round-trips every parameter', () => {
    const query = serializeListing(full)
    expect(query).toEqual({
      q: 'stratocaster',
      categoria: 'guitarras',
      marca: ['Fender', 'Gibson'],
      condicao: ['novo', 'usado'],
      preco: '20000-50000',
      frete: 'true',
      ordem: 'menor-preco',
      pagina: '3',
    })
    expect(parseListing(query)).toEqual(full)
  })

  it('omits every default, so an empty listing is an empty query', () => {
    expect(serializeListing(emptyListing())).toEqual({})
    expect(parseListing({})).toEqual(emptyListing())
  })

  it('writes repeatable values in a stable order regardless of input order', () => {
    const a = parseListing({ marca: ['Gibson', 'Fender'], condicao: ['usado', 'novo'] })
    const b = parseListing({ marca: ['Fender', 'Gibson'], condicao: ['novo', 'usado'] })
    expect(serializeListing(a)).toEqual(serializeListing(b))
    expect(serializeListing(a).condicao).toEqual(['novo', 'usado'])
  })

  it('accepts a single repeatable value given as a plain string', () => {
    expect(parseListing({ marca: 'Fender', condicao: 'seminovo' })).toMatchObject({
      brands: ['Fender'],
      conditions: ['seminovo'],
    })
  })

  it('drops unknown and malformed values instead of failing', () => {
    const state = parseListing({
      condicao: ['novo', 'quebrado'],
      ordem: 'aleatorio',
      pagina: '-2',
      preco: 'barato',
      frete: 'sim',
      categoria: 'Not A Slug',
      marca: ['', '  '],
      cor: 'azul',
    })
    expect(state).toEqual({ ...emptyListing(), conditions: ['novo'] })
  })

  it('rejects fractional and zero pages', () => {
    expect(parseListing({ pagina: '2.5' }).page).toBe(1)
    expect(parseListing({ pagina: '0' }).page).toBe(1)
  })

  it('dedupes brands and trims the search text', () => {
    const state = parseListing({ marca: ['Fender', 'Fender'], q: '  strat  ' })
    expect(state.brands).toEqual(['Fender'])
    expect(state.q).toBe('strat')
    expect(parseListing({ q: '   ' }).q).toBeNull()
  })

  it('caps the search text at the contract maximum', () => {
    expect(parseListing({ q: 'a'.repeat(200) }).q).toHaveLength(120)
  })

  it('ignores null entries Vue Router can hand over', () => {
    expect(parseListing({ marca: [null, 'Fender'], q: null }).brands).toEqual(['Fender'])
  })
})

describe('pinned category', () => {
  const context = { pinnedCategory: 'guitarras' }

  it('comes from the path, overriding any categoria in the query', () => {
    expect(parseListing({ categoria: 'teclados' }, context).category).toBe('guitarras')
  })

  it('never appears in the serialized query', () => {
    const state = parseListing({ marca: 'Fender' }, context)
    expect(serializeListing(state, context)).toEqual({ marca: ['Fender'] })
  })

  it('never surfaces as a removable chip and survives clearing', () => {
    const state = parseListing({ marca: 'Fender' }, context)
    expect(activeFilters(state, context)).toEqual([{ facet: 'brand', value: 'Fender' }])
    expect(clearFilters(state, context).category).toBe('guitarras')
  })

  it('still reaches the API', () => {
    const state = parseListing({}, context)
    expect(toApiParams(state).get('category')).toBe('guitarras')
  })
})

describe('preco', () => {
  it('parses bounded and open-ended ranges', () => {
    expect(parsePrice('20000-50000')).toEqual({ min: 20000, max: 50000 })
    expect(parsePrice('400000+')).toEqual({ min: 400000, max: null })
    expect(parsePrice('0-0')).toEqual({ min: 0, max: 0 })
  })

  it('rejects malformed values and inverted ranges', () => {
    for (const raw of ['', '-', '100-', '-100', '1-2-3', 'abc', '1.5-3', '+100', '500-100']) {
      expect(parsePrice(raw)).toBeNull()
    }
  })

  it('uses exactly the value format of every price bucket', () => {
    for (const bucket of PRICE_BUCKETS) {
      const state = parseListing({ preco: bucket.value })
      expect(state.price).toEqual({ min: bucket.min, max: bucket.max })
      expect(serializeListing(state).preco).toBe(bucket.value)
    }
  })

  it('makes a typed range and the matching preset produce the same URL', () => {
    const typed = priceFromInputs('200', '500')
    expect(typed).toEqual({ ok: true, range: { min: 20000, max: 50000 } })
    if (!typed.ok) return
    const fromTyped = serializeListing(updateListing(emptyListing(), { price: typed.range }))
    const fromPreset = serializeListing(parseListing({ preco: '20000-50000' }))
    expect(fromTyped).toEqual(fromPreset)
  })
})

describe('priceFromInputs', () => {
  it('converts reais to centavos, with or without cents and thousand dots', () => {
    expect(priceFromInputs('1.299,90', '')).toEqual({ ok: true, range: { min: 129990, max: null } })
    expect(priceFromInputs('', '39,9')).toEqual({ ok: true, range: { min: 0, max: 3990 } })
  })

  it('treats two empty inputs as no price filter', () => {
    expect(priceFromInputs(' ', '')).toEqual({ ok: true, range: null })
  })

  it('flags min above max, which must fire no request', () => {
    expect(priceFromInputs('500', '200')).toEqual({ ok: false, reason: 'min-above-max' })
  })

  it('flags text that is not a price', () => {
    expect(priceFromInputs('dez', '')).toEqual({ ok: false, reason: 'invalid' })
    expect(priceFromInputs('-5', '')).toEqual({ ok: false, reason: 'invalid' })
  })
})

describe('changes reset the page', () => {
  const onPage3 = { ...emptyListing(), page: 3 }

  it('on any filter or sort change', () => {
    expect(toggleBrand(onPage3, 'Fender').page).toBe(1)
    expect(toggleCondition(onPage3, 'novo').page).toBe(1)
    expect(updateListing(onPage3, { sort: 'maior-preco' }).page).toBe(1)
    expect(updateListing(onPage3, { freeShipping: true }).page).toBe(1)
  })

  it('but not when paging', () => {
    expect(goToPage(onPage3, 4).page).toBe(4)
    expect(goToPage(onPage3, 0).page).toBe(1)
  })

  it('toggles add and remove', () => {
    const once = toggleBrand(emptyListing(), 'Fender')
    expect(once.brands).toEqual(['Fender'])
    expect(toggleBrand(once, 'Fender').brands).toEqual([])
    expect(toggleCondition(toggleCondition(emptyListing(), 'usado'), 'novo').conditions).toEqual([
      'novo',
      'usado',
    ])
  })
})

describe('chips', () => {
  it('lists every active filter in rail order, without search text or sort', () => {
    expect(activeFilters(full)).toEqual([
      { facet: 'category', value: 'guitarras' },
      { facet: 'brand', value: 'Fender' },
      { facet: 'brand', value: 'Gibson' },
      { facet: 'condition', value: 'novo' },
      { facet: 'condition', value: 'usado' },
      { facet: 'price', value: { min: 20000, max: 50000 } },
      { facet: 'freeShipping' },
    ])
  })

  it('removes exactly one filter and resets the page', () => {
    for (const filter of activeFilters(full)) {
      const next = removeFilter(full, filter)
      expect(activeFilters(next)).toHaveLength(activeFilters(full).length - 1)
      expect(next.page).toBe(1)
      expect(next.q).toBe(full.q)
    }
  })

  it('clears every filter but keeps search text and sort', () => {
    const cleared = clearFilters(full)
    expect(activeFilters(cleared)).toEqual([])
    expect(cleared).toMatchObject({ q: 'stratocaster', sort: 'menor-preco', page: 1 })
  })
})

describe('toApiParams', () => {
  it('maps every field onto the API query and passes the contract', () => {
    const params = toApiParams(full)
    expect(params.getAll('brand')).toEqual(['Fender', 'Gibson'])
    expect(params.getAll('condition')).toEqual(['novo', 'usado'])
    expect(params.get('minPrice')).toBe('20000')
    expect(params.get('maxPrice')).toBe('50000')
    expect(params.get('freeShipping')).toBe('true')
    expect(params.get('perPage')).toBe('24')

    const raw: Record<string, string | string[]> = {}
    for (const key of new Set(params.keys())) {
      const values = params.getAll(key)
      raw[key] = values.length > 1 ? values : values[0]!
    }
    expect(productListQuerySchema.safeParse(raw).success).toBe(true)
  })

  it('sends no ceiling for an open-ended range', () => {
    const params = toApiParams(parseListing({ preco: '400000+' }))
    expect(params.get('minPrice')).toBe('400000')
    expect(params.has('maxPrice')).toBe(false)
  })

  it('is deterministic for equivalent states', () => {
    const a = parseListing({ marca: ['Gibson', 'Fender'] })
    const b = parseListing({ marca: ['Fender', 'Gibson'] })
    expect(toApiParams(a).toString()).toBe(toApiParams(b).toString())
  })
})
