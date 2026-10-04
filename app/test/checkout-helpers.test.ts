import {
  addressSchema,
  cardSchema,
  CARD_OUTCOMES,
  loginBodySchema,
  registerBodySchema,
} from '@timbre/contracts'
import { describe, expect, it } from 'vitest'
import en from '@/locales/en.json'
import ptBR from '@/locales/pt-BR.json'
import { cardBrand, cvvLength, expiryInPast, formatCardNumber, formatExpiry, luhnValid } from '@/lib/card'
import { safeRedirect, signInLocation } from '@/lib/redirect'
import { fieldErrors } from '@/lib/validation'

describe('card helpers', () => {
  it('formats numbers while typing', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
    expect(formatCardNumber('4111 11')).toBe('4111 11')
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005')
    expect(formatCardNumber('4111-1111-1111-1111-9999')).toBe('4111 1111 1111 1111 999')
  })

  it('formats expiry while typing', () => {
    expect(formatExpiry('1')).toBe('1')
    expect(formatExpiry('4')).toBe('04')
    expect(formatExpiry('1230')).toBe('12/30')
    expect(formatExpiry('12/3')).toBe('12/3')
  })

  it('passes Luhn for every fixture card and fails a typo', () => {
    for (const number of Object.keys(CARD_OUTCOMES)) expect(luhnValid(number), number).toBe(true)
    expect(luhnValid('4111111111111112')).toBe(false)
  })

  it('detects the brand and its CVV length', () => {
    expect(cardBrand('4111111111111111')).toBe('visa')
    expect(cardBrand('5555555555554444')).toBe('mastercard')
    expect(cardBrand('378282246310005')).toBe('amex')
    expect(cvvLength('378282246310005')).toBe(4)
    expect(cvvLength('4111111111111111')).toBe(3)
  })

  it('reads expiry against the injected clock, in UTC', () => {
    const aug2026 = Date.parse('2026-08-10T12:00:00Z')
    expect(expiryInPast('07/26', aug2026)).toBe(true)
    expect(expiryInPast('08/26', aug2026)).toBe(false)
    expect(expiryInPast('12/30', aug2026)).toBe(false)
    expect(expiryInPast('bad', aug2026)).toBe(false)
  })
})

describe('redirect round trip', () => {
  it('builds the sign-in location in the Page language', () => {
    expect(signInLocation('/checkout/shipping', 'pt-BR')).toBe('/sign-in?redirect=%2Fcheckout%2Fshipping')
    expect(signInLocation('/en/checkout/shipping?x=1', 'en')).toBe('/en/sign-in?redirect=%2Fen%2Fcheckout%2Fshipping%3Fx%3D1')
  })

  it('follows same-origin paths and keeps their language prefix', () => {
    expect(safeRedirect('/en/checkout/shipping', 'en')).toBe('/en/checkout/shipping')
    expect(safeRedirect(['/cart'], 'pt-BR')).toBe('/cart')
  })

  it('rejects anything that could leave the site', () => {
    for (const raw of ['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', '/javascript:x', '', undefined, 3]) {
      expect(safeRedirect(raw, 'en'), String(raw)).toBe('/en')
    }
  })
})

describe('validation keys are Platform copy', () => {
  const samples: Array<[Parameters<typeof fieldErrors>[0], Parameters<typeof fieldErrors>[1], unknown[]]> = [
    ['signIn', loginBodySchema, [{ email: '', password: '' }, { email: 'x', password: 'y' }]],
    [
      'signUp',
      registerBodySchema,
      [{ name: '', email: '', password: '' }, { name: 'A', email: 'a@', password: 'short' }, { name: 'Ana', email: 'a@b.co', password: 'alllowercase1!' }, { name: 'Ana', email: 'a@b.co', password: 'ALLUPPER1!' }, { name: 'Ana', email: 'a@b.co', password: 'NoNumber!!' }, { name: 'Ana', email: 'a@b.co', password: 'NoSymbol12' }],
    ],
    [
      'address',
      addressSchema,
      [{ recipient: '', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' }, { recipient: 'A', cep: '123', street: 'R', number: '1', complement: 'x'.repeat(81), district: 'D', city: 'C', state: 'XX' }],
    ],
    [
      'card',
      cardSchema,
      [{ number: '', holder: '', expiry: '', cvv: '' }, { number: '4111111111111112', holder: 'A', expiry: '13/30', cvv: '12' }, { number: '378282246310005', holder: 'ANA', expiry: '12/30', cvv: '123' }],
    ],
  ]

  function has(locale: unknown, key: string): boolean {
    const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], locale)
    return typeof value === 'string' && value.length > 0
  }

  it('maps every surfaced issue to a key that exists in both locales', () => {
    const keys = new Set<string>()
    for (const [form, schema, values] of samples) {
      for (const value of values) for (const key of Object.values(fieldErrors(form, schema, value))) keys.add(key)
    }
    expect(keys.size).toBeGreaterThan(15)
    const missing = [...keys].filter((key) => !has(ptBR, key) || !has(en, key))
    expect(missing).toEqual([])
  })

  it('names each password rule separately', () => {
    const kinds = ['alllowercase1!', 'ALLUPPER1!', 'NoNumber!!', 'NoSymbol12', 'Ab1!'].map(
      (password) => fieldErrors('signUp', registerBodySchema, { name: 'Ana', email: 'a@b.co', password }).password,
    )
    expect(kinds).toEqual([
      'validation.signUp.password.uppercase',
      'validation.signUp.password.lowercase',
      'validation.signUp.password.number',
      'validation.signUp.password.symbol',
      'validation.signUp.password.length',
    ])
  })

  it('flags a CVV that does not fit the brand', () => {
    expect(fieldErrors('card', cardSchema, { number: '378282246310005', holder: 'ANA', expiry: '12/30', cvv: '123' }).cvv).toBe(
      'validation.card.cvv.brand',
    )
  })
})
