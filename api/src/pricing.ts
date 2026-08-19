import {
  FREE_SHIPPING_THRESHOLD,
  type Cart,
  type CartLine,
  type ShippingOption,
} from '@timbre/contracts'
import type { CouponFixture } from '@timbre/fixtures'
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
}

function resolveLines(store: Store, cart: StoreCart): ResolvedLine[] {
  const resolved: ResolvedLine[] = []
  for (const storeLine of cart.lines) {
    const product = store.productById(storeLine.productId)
    if (!product) continue
    const found = storeLine.variantOptionId
      ? findVariantOption(product, storeLine.variantOptionId)
      : undefined
    const unitPrice = product.price + (found?.option.priceDelta ?? 0)
    resolved.push({
      product,
      variantOptionId: storeLine.variantOptionId,
      line: {
        id: storeLine.id,
        product: toProductSummary(store, product),
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

export function assertCouponApplies(
  store: Store,
  coupon: CouponFixture,
  lines: ResolvedLine[],
  subtotal: number,
): void {
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) < store.nowMs()) {
    throw new ApiError('COUPON_EXPIRED', 'Este cupom expirou.')
  }
  if (coupon.minSubtotal !== null && subtotal < coupon.minSubtotal) {
    throw new ApiError(
      'COUPON_MIN_NOT_MET',
      `Este cupom vale a partir de ${formatBRL(coupon.minSubtotal)}.`,
    )
  }
  if (coupon.onlyConditions) {
    const allowed = new Set(coupon.onlyConditions)
    const everyLineQualifies =
      lines.length > 0 && lines.every((entry) => allowed.has(entry.product.condition))
    if (!everyLineQualifies) {
      throw new ApiError(
        'COUPON_NOT_APPLICABLE',
        'Este cupom vale somente para produtos novos.',
      )
    }
  }
}

export function couponDiscountFor(coupon: CouponFixture, subtotal: number): number {
  if (coupon.kind === 'free-shipping') return 0
  const raw =
    coupon.kind === 'fixed'
      ? coupon.amount
      : Math.floor((subtotal * coupon.amount) / 100)
  const capped = coupon.maxDiscount === null ? raw : Math.min(raw, coupon.maxDiscount)
  return Math.max(0, Math.min(capped, subtotal))
}

export function buildCart(store: Store, cart: StoreCart): Cart {
  const resolved = resolveLines(store, cart)
  const lines = resolved.map((entry) => entry.line)
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  let appliedCoupon: CouponFixture | undefined
  if (cart.couponCode) {
    const coupon = store.couponByCode(cart.couponCode)
    if (coupon) {
      try {
        assertCouponApplies(store, coupon, resolved, subtotal)
        appliedCoupon = coupon
      } catch {
        cart.couponCode = null
      }
    } else {
      cart.couponCode = null
    }
  }

  const couponDiscount = appliedCoupon ? couponDiscountFor(appliedCoupon, subtotal) : 0
  const info = lookupCep(store, cart.cep)
  const options: ShippingOption[] = buildShippingOptions(info, {
    standardFree:
      subtotal >= FREE_SHIPPING_THRESHOLD ||
      (lines.length > 0 && lines.every((line) => line.product.freeShipping)),
    allFree: appliedCoupon?.kind === 'free-shipping',
  })

  const selected =
    options.find((option) => option.id === cart.selectedShippingId) ?? options[0]!
  cart.selectedShippingId = selected.id
  const shipping = lines.length > 0 ? selected.price : 0

  return {
    id: cart.id,
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
  }
}
