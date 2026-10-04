import type { CartLine, SellerRef } from '@timbre/contracts'

export interface SellerGroup {
  seller: SellerRef
  lines: CartLine[]
}

/**
 * Cart lines under one heading per seller, because shipping is quoted per seller.
 * Groups order by seller name (pt-BR collation), ties on seller id; lines keep the
 * order the API returned them in.
 */
export function groupLinesBySeller(lines: readonly CartLine[]): SellerGroup[] {
  const groups = new Map<string, SellerGroup>()
  for (const line of lines) {
    const seller = line.product.seller
    const group = groups.get(seller.id) ?? { seller, lines: [] }
    group.lines.push(line)
    groups.set(seller.id, group)
  }
  return [...groups.values()].sort(
    (a, b) => a.seller.name.localeCompare(b.seller.name, 'pt-BR') || a.seller.id.localeCompare(b.seller.id),
  )
}

/** Units in the cart: what the header count shows. */
export function cartUnitCount(lines: readonly Pick<CartLine, 'quantity'>[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}
