import type { ShippingOption, UF } from '@timbre/contracts'
import { cepRanges } from '@timbre/fixtures'
import { ApiError } from './errors.js'
import type { Store } from './store.js'

export interface CepInfo {
  cep: string
  city: string
  state: UF
  standardEtaDays: number
  expressEtaDays: number
  expressAvailable: boolean
}

export function lookupCep(store: Store, cep: string): CepInfo {
  const fixture = store.ceps.find((candidate) => candidate.cep === cep)
  if (fixture) {
    if (fixture.behaviour === 'not-found') {
      throw new ApiError('CEP_NOT_FOUND', 'We could not find this CEP.', {
        fields: { cep: 'CEP not found.' },
      })
    }
    if (fixture.behaviour === 'server-error') {
      throw new ApiError('INTERNAL_ERROR', 'A consulta de CEP falhou. Tente novamente.')
    }
    return {
      cep: fixture.cep,
      city: fixture.city,
      state: fixture.state,
      standardEtaDays: fixture.standardEtaDays,
      expressEtaDays: Math.max(1, Math.ceil(fixture.standardEtaDays / 2)),
      expressAvailable: fixture.expressAvailable,
    }
  }

  const prefix = Number(cep.slice(0, 2))
  const range = cepRanges.find((candidate) => prefix >= candidate.from && prefix <= candidate.to)
  if (!range) {
    throw new ApiError('CEP_NOT_FOUND', 'We could not find this CEP.', {
      fields: { cep: 'CEP not found.' },
    })
  }
  const digitSum = [...cep].reduce((sum, digit) => sum + Number(digit), 0)
  const standardEtaDays = 2 + (digitSum % 8)
  return {
    cep,
    city: range.city,
    state: range.uf,
    standardEtaDays,
    expressEtaDays: Math.max(1, Math.ceil(standardEtaDays / 2)),
    expressAvailable: true,
  }
}

export interface ShippingContext {
  standardFree: boolean
  allFree: boolean
}

export function buildShippingOptions(info: CepInfo, context: ShippingContext): ShippingOption[] {
  const options: ShippingOption[] = [
    {
      id: 'standard',
      label: 'Entrega padrão',
      price: context.allFree || context.standardFree ? 0 : 2490,
      etaDays: info.standardEtaDays,
    },
  ]
  if (info.expressAvailable) {
    options.push({
      id: 'express',
      label: 'Entrega expressa',
      price: context.allFree ? 0 : 4990,
      etaDays: info.expressEtaDays,
    })
  }
  return options
}
