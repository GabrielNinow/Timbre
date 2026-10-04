import { cartSchema, type Cart, type Currency, type ShippingMethodId } from '@timbre/contracts'
import { apiGet, apiSend } from '@/api/client'
import { readStored, writeStored } from '@/lib/storage'

/**
 * The server owns the cart (rule 4); the client only remembers a guest cart's id.
 * A signed-in cart is found by the token, so its id is never stored.
 */
function remember(cart: Cart): Cart {
  if (!readStored('session')) writeStored('cart', cart.id)
  return cart
}

const query = (currency: Currency) => new URLSearchParams(currency === 'BRL' ? {} : { currency })

type Method = 'POST' | 'PUT' | 'PATCH' | 'DELETE'
async function send(method: Method, path: string, currency: Currency, body?: unknown): Promise<Cart> {
  return remember(await apiSend(path, cartSchema, { method, body, params: query(currency) }))
}

export async function fetchCart(currency: Currency, signal?: AbortSignal): Promise<Cart> {
  return remember(await apiGet('/cart', cartSchema, { params: query(currency), signal }))
}

export function addCartItem(
  item: { productId: string; variantOptionId?: string; quantity: number },
  currency: Currency,
): Promise<Cart> {
  return send('POST', '/cart/items', currency, item)
}

export function updateCartLine(lineId: string, quantity: number, currency: Currency): Promise<Cart> {
  return send('PATCH', `/cart/items/${encodeURIComponent(lineId)}`, currency, { quantity })
}

export function removeCartLine(lineId: string, currency: Currency): Promise<Cart> {
  return send('DELETE', `/cart/items/${encodeURIComponent(lineId)}`, currency)
}

export function applyCoupon(code: string, currency: Currency): Promise<Cart> {
  return send('POST', '/cart/coupon', currency, { code })
}

export function removeCoupon(currency: Currency): Promise<Cart> {
  return send('DELETE', '/cart/coupon', currency)
}

export function setCartCep(cep: string, currency: Currency): Promise<Cart> {
  return send('PUT', '/cart/cep', currency, { cep })
}

export function setCartShipping(shippingId: ShippingMethodId, currency: Currency): Promise<Cart> {
  return send('PUT', '/cart/shipping', currency, { shippingId })
}
