import type { CartLine } from '@timbre/contracts'
import { describe, expect, it } from 'vitest'
import { cartUnitCount, groupLinesBySeller } from '@/lib/cart'

function line(id: string, sellerId: string, sellerName: string, quantity = 1): CartLine {
  return {
    id,
    quantity,
    unitPrice: 1000,
    lineTotal: 1000 * quantity,
    availableStock: 5,
    variant: null,
    product: {
      seller: { id: sellerId, name: sellerName, slug: sellerId, tier: null, state: 'SP' },
    } as CartLine['product'],
  }
}

describe('groupLinesBySeller', () => {
  it('groups lines under their seller, ordered by seller name', () => {
    const groups = groupLinesBySeller([
      line('l1', 's-03', 'Loja do Músico'),
      line('l2', 's-01', 'Casa do Som'),
      line('l3', 's-03', 'Loja do Músico'),
      line('l4', 's-02', 'Áudio Prime'),
    ])
    expect(groups.map((group) => group.seller.name)).toEqual(['Áudio Prime', 'Casa do Som', 'Loja do Músico'])
    expect(groups[2]!.lines.map((entry) => entry.id)).toEqual(['l1', 'l3'])
  })

  it('breaks name ties on seller id', () => {
    const groups = groupLinesBySeller([line('l1', 's-09', 'Twin'), line('l2', 's-04', 'Twin')])
    expect(groups.map((group) => group.seller.id)).toEqual(['s-04', 's-09'])
  })

  it('returns no groups for an empty cart', () => {
    expect(groupLinesBySeller([])).toEqual([])
  })
})

describe('cartUnitCount', () => {
  it('counts units, not lines', () => {
    expect(cartUnitCount([line('a', 's', 'S', 2), line('b', 's', 'S', 3)])).toBe(5)
    expect(cartUnitCount([])).toBe(0)
  })
})
