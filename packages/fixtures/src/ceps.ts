import type { UF } from '@timbre/contracts'

export type CepBehaviour = 'ok' | 'not-found' | 'server-error'

export interface CepFixture {
  readonly cep: string
  readonly city: string
  readonly state: UF
  readonly standardEtaDays: number
  readonly expressAvailable: boolean
  readonly behaviour: CepBehaviour
}

export const ceps: readonly CepFixture[] = Object.freeze([
  {
    cep: '89010000',
    city: 'Blumenau',
    state: 'SC',
    standardEtaDays: 2,
    expressAvailable: true,
    behaviour: 'ok',
  },
  {
    cep: '01310100',
    city: 'São Paulo',
    state: 'SP',
    standardEtaDays: 1,
    expressAvailable: true,
    behaviour: 'ok',
  },
  {
    cep: '69900000',
    city: 'Rio Branco',
    state: 'AC',
    standardEtaDays: 9,
    expressAvailable: false,
    behaviour: 'ok',
  },
  {
    cep: '00000000',
    city: '',
    state: 'SP',
    standardEtaDays: 0,
    expressAvailable: false,
    behaviour: 'not-found',
  },
  {
    cep: '99999999',
    city: '',
    state: 'RS',
    standardEtaDays: 0,
    expressAvailable: false,
    behaviour: 'server-error',
  },
] as const)

interface CepRange {
  readonly from: number
  readonly to: number
  readonly uf: UF
  readonly city: string
}

export const cepRanges: readonly CepRange[] = Object.freeze([
  { from: 1, to: 19, uf: 'SP', city: 'São Paulo' },
  { from: 20, to: 28, uf: 'RJ', city: 'Rio de Janeiro' },
  { from: 29, to: 29, uf: 'ES', city: 'Vitória' },
  { from: 30, to: 39, uf: 'MG', city: 'Belo Horizonte' },
  { from: 40, to: 48, uf: 'BA', city: 'Salvador' },
  { from: 49, to: 49, uf: 'SE', city: 'Aracaju' },
  { from: 50, to: 56, uf: 'PE', city: 'Recife' },
  { from: 57, to: 57, uf: 'AL', city: 'Maceió' },
  { from: 58, to: 58, uf: 'PB', city: 'João Pessoa' },
  { from: 59, to: 59, uf: 'RN', city: 'Natal' },
  { from: 60, to: 63, uf: 'CE', city: 'Fortaleza' },
  { from: 64, to: 64, uf: 'PI', city: 'Teresina' },
  { from: 65, to: 65, uf: 'MA', city: 'São Luís' },
  { from: 66, to: 68, uf: 'PA', city: 'Belém' },
  { from: 69, to: 69, uf: 'AM', city: 'Manaus' },
  { from: 70, to: 73, uf: 'DF', city: 'Brasília' },
  { from: 74, to: 76, uf: 'GO', city: 'Goiânia' },
  { from: 77, to: 77, uf: 'TO', city: 'Palmas' },
  { from: 78, to: 78, uf: 'MT', city: 'Cuiabá' },
  { from: 79, to: 79, uf: 'MS', city: 'Campo Grande' },
  { from: 80, to: 87, uf: 'PR', city: 'Curitiba' },
  { from: 88, to: 89, uf: 'SC', city: 'Florianópolis' },
  { from: 90, to: 99, uf: 'RS', city: 'Porto Alegre' },
] as const)
