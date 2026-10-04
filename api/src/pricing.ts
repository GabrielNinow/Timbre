import {
  FREE_SHIPPING_THRESHOLD,
  type Cart,
  type CartLine,
  type Currency,
  type ShippingOption,
} from '@timbre/contracts'
import type { CouponFixture } from '@timbre/fixtures'
import { convert } from './currency.js'
import { ApiError } from './errors.js'
import { availableStock, findVariantOption, toProductSummary } from './mappers.js'
import { buildShippingOptions, lookupCep } from './shipping.js'
import type { Store, StoreCart, StoreProduct } from './store.js'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number): string {
  return brl.format(value / 100)
}

export interface ResolvedLine {
  line: CartLine
  product: StoreProduct
  variantOptionId: string | null
  /** The line total in reais: the amount every eligibility rule reads. */
  brlLineTotal: number
}

function resolveLines(store: Store, cart: StoreCart, currency: Currency): ResolvedLine[] {
  const resolved: ResolvedLine[] = []
  for (const storeLine of cart.lines) {
    const product = store.productById(storeLine.productId)
    if (!product) continue
    const found = storeLine.variantOptionId
      ? findVariantOption(product, storeLine.variantOptionId)
      : undefined
    const brlUnitPrice = product.price + (found?.option.priceDelta ?? 0)
    const unitPrice = convert(brlUnitPrice, currency)
    resolved.push({
      product,
      variantOptionId: storeLine.variantOptionId,
      brlLineTotal: brlUnitPrice * storeLine.quantity,
      line: {
        id: storeLine.id,
        product: toProductSummary(store, product, currency),
        variant: found
          ? { groupLabel: found.group.label, optionId: found.option.id, optionName: found.option.name }
          : null,
        unitPrice,
        quantity: storeLine.quantity,
        lineTotal: unitPrice * storeLine.quantity,
        availableStock: availableStock(product, storeLine.variantOptionId),
      },
    })
  }
  return resolved
}

/** Always called with the BRL subtotal: eligibility never depends on the currency. */
export function assertCouponApplies(
  store: Store,
  coupon: CouponFixture,
  lines: ResolvedLine[],
  brlSubtotal: number,
): void {
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) < store.nowMs()) {
    throw new ApiError('COUPON_EXPIRED', 'This coupon has expired.')
  }
  if (coupon.minSubtotal !== null && brlSubtotal < coupon.minSubtotal) {
    throw new ApiError(
      'COUPON_MIN_NOT_MET',
      `This coupon requires a subtotal of at least ${formatBRL(coupon.minSubtotal)}.`,
    )
  }
  if (coupon.onlyConditions) {
    const allowed = new Set(coupon.onlyConditions)
    const everyLineQualifies =
      lines.length > 0 && lines.every((entry) => allowed.has(entry.product.condition))
    if (!everyLineQualifies) {
      throw new ApiError('COUPON_NOT_APPLICABLE', 'This coupon applies to new products only.')
    }
  }
}

/** The discount in reais, computed on the BRL subtotal. */
export function couponDiscountFor(coupon: CouponFixture, brlSubtotal: number): number {
  if (coupon.kind === 'free-shipping') return 0
  const raw =
    coupon.kind === 'fixed'
      ? coupon.amount
      : Math.floor((brlSubtotal * coupon.amount) / 100)
  const capped = coupon.maxDiscount === null ? raw : Math.min(raw, coupon.maxDiscount)
  return Math.max(0, Math.min(capped, brlSubtotal))
}

export interface PricedCart {
  cart: Cart
  resolved: ResolvedLine[]
  /** Subtotal in reais, whatever the response currency. */
  brlSubtotal: number
}

/**
 * Prices a cart in `currency` (ADR 0002). Free shipping and coupons are decided on
 * the BRL subtotal; only the resulting amounts convert. Every sum is computed from
 * converted values, so the totals always add up in the response currency.
 */
export function priceCart(store: Store, cart: StoreCart, currency: Currency): PricedCart {
  const resolved = resolveLines(store, cart, currency)
  const lines = resolved.map((entry) => entry.line)
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const brlSubtotal = resolved.reduce((sum, entry) => sum + entry.brlLineTotal, 0)

  let appliedCoupon: CouponFixture | undefined
  if (cart.couponCode) {
    const coupon = store.couponByCode(cart.couponCode)
    if (coupon) {
      try {
        assertCouponApplies(store, coupon, resolved, brlSubtotal)
        appliedCoupon = coupon
      } catch {
        cart.couponCode = null
      }
    } else {
      cart.couponCode = null
    }
  }

  const couponDiscount = appliedCoupon
    ? Math.min(convert(couponDiscountFor(appliedCoupon, brlSubtotal), currency), subtotal)
    : 0
  const info = lookupCep(store, cart.cep)
  const options: ShippingOption[] = buildShippingOptions(
    info,
    {
      standardFree:
        brlSubtotal >= FREE_SHIPPING_THRESHOLD ||
        (lines.length > 0 && lines.every((line) => line.product.freeShipping)),
      allFree: appliedCoupon?.kind === 'free-shipping',
    },
    currency,
  )
  const selected =
    options.find((option) => option.id === cart.selectedShippingId) ?? options[0]!
  cart.selectedShippingId = selected.id
  const shipping = lines.length > 0 ? selected.price : 0

  return {
    resolved,
    brlSubtotal,
    cart: {
      id: cart.id,
      currency,
      cep: cart.cep,
      lines,
      coupon: appliedCoupon ? { code: appliedCoupon.code, discount: couponDiscount } : null,
      shippingOptions: options,
      selectedShippingId: selected.id,
      totals: {
        subtotal,
        couponDiscount,
        shipping,
        total: Math.max(0, subtotal - couponDiscount + shipping),
      },
    },
  }
}

export function buildCart(store: Store, cart: StoreCart, currency: Currency): Cart {
  return priceCart(store, cart, currency).cart
}
