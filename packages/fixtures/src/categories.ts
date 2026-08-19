export interface CategoryFixture {
  readonly id: string
  readonly slug: string
  readonly name: string
}

export const categories: readonly CategoryFixture[] = Object.freeze([
  { id: 'c-01', slug: 'guitarras', name: 'Guitarras e Baixos' },
  { id: 'c-02', slug: 'teclados', name: 'Teclados e Sintetizadores' },
  { id: 'c-03', slug: 'bateria', name: 'Bateria e Percussão' },
  { id: 'c-04', slug: 'estudio', name: 'Estúdio e Gravação' },
  { id: 'c-05', slug: 'pedais', name: 'Pedais e Efeitos' },
  { id: 'c-06', slug: 'acessorios', name: 'Acessórios' },
] as const)
