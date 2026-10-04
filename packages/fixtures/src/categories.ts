export interface CategoryFixture {
  readonly id: string
  readonly slug: string
  readonly name: string
}

export const categories: readonly CategoryFixture[] = Object.freeze([
  { id: 'c-01', slug: 'guitars', name: 'Guitarras e Baixos' },
  { id: 'c-02', slug: 'keyboards', name: 'Teclados e Sintetizadores' },
  { id: 'c-03', slug: 'drums', name: 'Bateria e Percussão' },
  { id: 'c-04', slug: 'studio', name: 'Estúdio e Gravação' },
  { id: 'c-05', slug: 'pedals', name: 'Pedais e Efeitos' },
  { id: 'c-06', slug: 'accessories', name: 'Acessórios' },
] as const)
