import type { SellerTier, UF } from '@timbre/contracts'

export interface SellerFixture {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly tier: SellerTier | null
  readonly state: UF
  readonly rating: number
  readonly salesCount: number
  readonly onTimeRate: number
  readonly memberSince: string
  readonly bio: string
}

export const sellers: readonly SellerFixture[] = Object.freeze([
  {
    id: 's-01',
    name: 'Casa do Som',
    slug: 'casa-do-som',
    tier: 'PLATINUM',
    state: 'SP',
    rating: 48,
    salesCount: 4820,
    onTimeRate: 98,
    memberSince: '2019-03-12T00:00:00Z',
    bio: 'Loja física em São Paulo desde 2009. Instrumentos novos e seminovos revisados na casa.',
  },
  {
    id: 's-02',
    name: 'Áudio Prime',
    slug: 'audio-prime',
    tier: 'PLATINUM',
    state: 'SP',
    rating: 49,
    salesCount: 3910,
    onTimeRate: 99,
    memberSince: '2018-07-01T00:00:00Z',
    bio: 'Especialista em áudio profissional e sintetizadores. Envio no mesmo dia até as 15h.',
  },
  {
    id: 's-03',
    name: 'Loja do Músico',
    slug: 'loja-do-musico',
    tier: 'GOLD',
    state: 'RJ',
    rating: 45,
    salesCount: 2140,
    onTimeRate: 95,
    memberSince: '2020-01-20T00:00:00Z',
    bio: 'Do iniciante ao palco. Atendimento por WhatsApp e retirada na loja da Tijuca.',
  },
  {
    id: 's-04',
    name: 'Studio Norte',
    slug: 'studio-norte',
    tier: 'GOLD',
    state: 'PR',
    rating: 44,
    salesCount: 1680,
    onTimeRate: 94,
    memberSince: '2020-09-08T00:00:00Z',
    bio: 'Equipamento de estúdio e home studio. Montamos setup completo sob orçamento.',
  },
  {
    id: 's-05',
    name: 'Instrumentos SC',
    slug: 'instrumentos-sc',
    tier: 'SILVER',
    state: 'SC',
    rating: 41,
    salesCount: 870,
    onTimeRate: 91,
    memberSince: '2021-11-15T00:00:00Z',
    bio: 'Instrumentos de entrada e acessórios com preço de custo baixo.',
  },
  {
    id: 's-06',
    name: 'Marcos Andrade',
    slug: 'marcos-andrade',
    tier: null,
    state: 'MG',
    rating: 47,
    salesCount: 132,
    onTimeRate: 97,
    memberSince: '2022-05-04T00:00:00Z',
    bio: 'Músico vendendo equipamento próprio. Tudo testado antes do anúncio.',
  },
  {
    id: 's-07',
    name: 'Julia Ferraz',
    slug: 'julia-ferraz',
    tier: null,
    state: 'BA',
    rating: 39,
    salesCount: 48,
    onTimeRate: 88,
    memberSince: '2023-02-17T00:00:00Z',
    bio: 'Desapegando de equipamento de estúdio caseiro. Aceito retirada em Salvador.',
  },
  {
    id: 's-08',
    name: 'Vintage Room',
    slug: 'vintage-room',
    tier: 'SILVER',
    state: 'RS',
    rating: 46,
    salesCount: 610,
    onTimeRate: 96,
    memberSince: '2019-10-30T00:00:00Z',
    bio: 'Curadoria de instrumentos vintage e raros. Poucas peças, todas documentadas.',
  },
] as const)
