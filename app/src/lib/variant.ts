import type { ProductDetail } from '@timbre/contracts'

/**
 * The product page's buy path, derived from the product and the `?option=` query.
 * Components never compute price, stock or the stepper cap themselves.
 *
 * Every fixture product has at most one variant group, so a selection is a single
 * option id. Option ids are unique across groups, which keeps this sound if a
 * second group ever appears; choosing one option per group would extend it.
 */

export const MAX_QUANTITY = 99
export const LOW_STOCK = 3

export type BuyBlock = 'sold-out-option' | 'out-of-stock'

export interface SelectedOption {
  id: string
  name: string
  groupLabel: string
}

export interface BuyState {
  option: SelectedOption | null
  /** Unit price in the response's currency cents: base plus the option's delta. */
  unitPrice: number
  listPrice: number | null
  stock: number
  /** The stepper's upper bound: never above stock, never below 1 when buyable. */
  maxQuantity: number
  lowStock: boolean
  blocked: BuyBlock | null
}

type Product = Pick<ProductDetail, 'price' | 'listPrice' | 'stock' | 'variants'>

function options(product: Product) {
  return (product.variants ?? []).flatMap((group) =>
    group.options.map((option) => ({ ...option, groupLabel: group.label })),
  )
}

/** The default option: the first one in stock, else the first one. */
export function defaultOptionId(product: Product): string | null {
  const all = options(product)
  return (all.find((option) => option.stock > 0) ?? all[0])?.id ?? null
}

/** Resolves `?option=`. An unknown or missing value falls back to the default option. */
export function selectOption(product: Product, raw: unknown): string | null {
  const all = options(product)
  if (all.length === 0) return null
  const wanted = Array.isArray(raw) ? raw[0] : raw
  return all.some((option) => option.id === wanted) ? (wanted as string) : defaultOptionId(product)
}

/** Canonical query: the default option is omitted so the bare product URL stays canonical. */
export function optionQuery(product: Product, optionId: string | null): { option?: string } {
  if (optionId === null || optionId === defaultOptionId(product)) return {}
  return { option: optionId }
}

export function buyState(product: Product, optionId: string | null): BuyState {
  const chosen = optionId === null ? undefined : options(product).find((option) => option.id === optionId)
  const stock = chosen ? chosen.stock : product.stock
  const delta = chosen?.priceDelta ?? 0
  let blocked: BuyBlock | null = null
  if (stock === 0) blocked = chosen && options(product).some((option) => option.stock > 0) ? 'sold-out-option' : 'out-of-stock'
  return {
    option: chosen ? { id: chosen.id, name: chosen.name, groupLabel: chosen.groupLabel } : null,
    unitPrice: product.price + delta,
    listPrice: product.listPrice === null ? null : product.listPrice + delta,
    stock,
    maxQuantity: Math.min(stock, MAX_QUANTITY),
    lowStock: stock > 0 && stock <= LOW_STOCK,
    blocked,
  }
}

/** Keeps a chosen quantity inside the current option's bounds. */
export function clampQuantity(quantity: number, state: BuyState): number {
  if (state.maxQuantity < 1) return 1
  return Math.min(Math.max(1, Math.trunc(quantity) || 1), state.maxQuantity)
}
