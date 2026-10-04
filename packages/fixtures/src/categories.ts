export interface CategoryFixture {
  readonly id: string
  readonly slug: string
}

export const categories: readonly CategoryFixture[] = Object.freeze([
  { id: 'c-01', slug: 'guitars' },
  { id: 'c-02', slug: 'keyboards' },
  { id: 'c-03', slug: 'drums' },
  { id: 'c-04', slug: 'studio' },
  { id: 'c-05', slug: 'pedals' },
  { id: 'c-06', slug: 'accessories' },
] as const)
