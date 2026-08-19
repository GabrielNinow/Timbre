import type { Address } from '@timbre/contracts'

export interface UserFixture {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly password: string
  readonly createdAt: string
  readonly token: string
  readonly locked: boolean
  readonly loginDelayMs: number
  readonly addresses: readonly Address[]
  readonly hidden: boolean
}

const brunoAddresses: readonly Address[] = Object.freeze([
  {
    recipient: 'Bruno Lima',
    cep: '89010000',
    street: 'Rua XV de Novembro',
    number: '1400',
    complement: 'Apto 802',
    district: 'Centro',
    city: 'Blumenau',
    state: 'SC',
  },
  {
    recipient: 'Bruno Lima',
    cep: '01310100',
    street: 'Avenida Paulista',
    number: '900',
    complement: '',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
] as const)

export const users: readonly UserFixture[] = Object.freeze([
  {
    id: 'u-01',
    name: 'Ana Souza',
    email: 'ana.souza@timbre.test',
    password: 'Teste@1234',
    createdAt: '2025-11-02T14:20:00Z',
    token: 'tok_u-01_ana',
    locked: false,
    loginDelayMs: 0,
    addresses: Object.freeze([]),
    hidden: false,
  },
  {
    id: 'u-02',
    name: 'Bruno Lima',
    email: 'bruno.lima@timbre.test',
    password: 'Teste@1234',
    createdAt: '2024-03-18T10:05:00Z',
    token: 'tok_u-02_bruno',
    locked: false,
    loginDelayMs: 0,
    addresses: brunoAddresses,
    hidden: false,
  },
  {
    id: 'u-03',
    name: 'Marina Rocha',
    email: 'bloqueado@timbre.test',
    password: 'Teste@1234',
    createdAt: '2024-08-09T09:00:00Z',
    token: 'tok_u-03_bloqueado',
    locked: true,
    loginDelayMs: 0,
    addresses: Object.freeze([]),
    hidden: false,
  },
  {
    id: 'u-04',
    name: 'Paulo Tavares',
    email: 'lento@timbre.test',
    password: 'Teste@1234',
    createdAt: '2025-01-27T16:45:00Z',
    token: 'tok_u-04_lento',
    locked: false,
    loginDelayMs: 3000,
    addresses: Object.freeze([]),
    hidden: false,
  },
  {
    id: 'u-05',
    name: 'Ricardo Nunes',
    email: 'ricardo.nunes@timbre.test',
    password: 'Teste@1234',
    createdAt: '2024-06-11T11:30:00Z',
    token: 'tok_u-05_ricardo',
    locked: false,
    loginDelayMs: 0,
    addresses: Object.freeze([]),
    hidden: true,
  },
] as const)

export const NEXT_USER_SEQUENCE = 6
