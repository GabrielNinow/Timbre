import { describe, expect, it } from 'vitest'
import en from '@/locales/en.json'
import ptBR from '@/locales/pt-BR.json'
import {
  languageFromParam,
  languageOfPath,
  languageParam,
  localizePath,
  stripLanguage,
} from '@/lib/language'

describe('languageOfPath', () => {
  it('reads English only from the /en prefix', () => {
    expect(languageOfPath('/en')).toBe('en')
    expect(languageOfPath('/en/search?q=strat')).toBe('en')
    expect(languageOfPath('/en?x=1')).toBe('en')
    expect(languageOfPath('/en#top')).toBe('en')
  })

  it('treats everything else as Portuguese', () => {
    expect(languageOfPath('/')).toBe('pt-BR')
    expect(languageOfPath('/search')).toBe('pt-BR')
    expect(languageOfPath('/english')).toBe('pt-BR')
    expect(languageOfPath('/c/en')).toBe('pt-BR')
    expect(languageOfPath('/fr/search')).toBe('pt-BR')
    expect(languageOfPath('/search?lang=/en')).toBe('pt-BR')
  })
})

describe('stripLanguage', () => {
  it('removes the prefix and keeps query and hash', () => {
    expect(stripLanguage('/en/c/guitars?brand=Fender#results')).toBe('/c/guitars?brand=Fender#results')
    expect(stripLanguage('/en')).toBe('/')
    expect(stripLanguage('/en?q=x')).toBe('/?q=x')
  })

  it('leaves unprefixed paths alone', () => {
    expect(stripLanguage('/search?q=x')).toBe('/search?q=x')
    expect(stripLanguage('/english')).toBe('/english')
  })
})

describe('localizePath', () => {
  it('adds the prefix for English', () => {
    expect(localizePath('/', 'en')).toBe('/en')
    expect(localizePath('/search?q=strat&page=2', 'en')).toBe('/en/search?q=strat&page=2')
    expect(localizePath('/?q=x', 'en')).toBe('/en?q=x')
  })

  it('removes the prefix for Portuguese', () => {
    expect(localizePath('/en/search?q=strat', 'pt-BR')).toBe('/search?q=strat')
    expect(localizePath('/en', 'pt-BR')).toBe('/')
  })

  it('switches between languages and back without loss', () => {
    const start = '/c/guitars?condition=new&sort=price-asc#grid'
    const english = localizePath(start, 'en')
    expect(english).toBe('/en/c/guitars?condition=new&sort=price-asc#grid')
    expect(localizePath(english, 'pt-BR')).toBe(start)
  })

  it('is idempotent', () => {
    expect(localizePath(localizePath('/cart', 'en'), 'en')).toBe('/en/cart')
    expect(localizePath(localizePath('/en/cart', 'pt-BR'), 'pt-BR')).toBe('/cart')
  })

  it('does not mistake an unknown prefix for a language', () => {
    expect(localizePath('/fr/search', 'en')).toBe('/en/fr/search')
  })
})

describe('route param', () => {
  it('maps languages to the optional :locale param and back', () => {
    expect(languageParam('en')).toBe('en')
    expect(languageParam('pt-BR')).toBeUndefined()
    expect(languageFromParam('en')).toBe('en')
    expect(languageFromParam(undefined)).toBe('pt-BR')
    expect(languageFromParam('')).toBe('pt-BR')
    expect(languageFromParam(['en'])).toBe('pt-BR')
  })
})

describe('locale parity', () => {
  function keys(value: unknown, prefix = ''): string[] {
    if (value === null || typeof value !== 'object') return [prefix]
    return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key))
  }
  function pluralForms(value: unknown, prefix = ''): Record<string, number> {
    if (typeof value === 'string') return { [prefix]: value.split(' | ').length }
    if (value === null || typeof value !== 'object') return {}
    return Object.assign(
      {},
      ...Object.entries(value).map(([key, child]) => pluralForms(child, prefix ? `${prefix}.${key}` : key)),
    )
  }

  it('gives both languages exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(ptBR).sort())
  })

  it('gives every message the same number of plural forms', () => {
    expect(pluralForms(en)).toEqual(pluralForms(ptBR))
  })

  it('leaves no English message empty', () => {
    const empty = Object.entries(pluralForms(en)).filter(([key]) => {
      const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en)
      return typeof value === 'string' && value.trim() === ''
    })
    expect(empty).toEqual([])
  })
})
