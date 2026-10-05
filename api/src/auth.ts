import type { ApiRequest } from './core.js'
import { errors } from './errors.js'
import type { Store, StoreCart, StoreUser } from './store.js'

export function optionalUser(store: Store, request: Pick<ApiRequest, 'headers' | 'query'>): StoreUser | undefined {
  const header = request.headers.authorization
  if (!header) return undefined
  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') return undefined
  return store.userByToken(token)
}

export function requireUser(store: Store, request: Pick<ApiRequest, 'headers' | 'query'>): StoreUser {
  const header = request.headers.authorization
  if (!header) throw errors.unauthorized()
  const user = optionalUser(store, request)
  if (!user) throw errors.unauthorized('Invalid or expired session.')
  return user
}

export function resolveCart(
  store: Store,
  request: Pick<ApiRequest, 'headers' | 'query'>,
  user: StoreUser | undefined,
): StoreCart {
  if (user) return store.cartForUser(user.id)
  const headerValue = request.headers['x-cart-id']
  const cartId = Array.isArray(headerValue) ? headerValue[0] : headerValue
  if (cartId) {
    const existing = store.cartById(cartId)
    if (existing && existing.userId === null) return existing
  }
  return store.createCart(null)
}

export function mergeGuestCart(store: Store, request: Pick<ApiRequest, 'headers' | 'query'>, user: StoreUser): void {
  const headerValue = request.headers['x-cart-id']
  const cartId = Array.isArray(headerValue) ? headerValue[0] : headerValue
  if (!cartId) return
  const guestCart = store.cartById(cartId)
  if (!guestCart || guestCart.userId !== null) return

  const userCart = store.cartForUser(user.id)
  for (const guestLine of guestCart.lines) {
    const existing = userCart.lines.find(
      (line) =>
        line.productId === guestLine.productId && line.variantOptionId === guestLine.variantOptionId,
    )
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + guestLine.quantity)
    } else {
      userCart.lines.push({ ...guestLine })
    }
  }
  userCart.couponCode = userCart.couponCode ?? guestCart.couponCode
  userCart.cep = guestCart.cep
  store.carts.delete(guestCart.id)
}
