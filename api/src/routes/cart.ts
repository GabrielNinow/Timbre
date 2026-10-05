import {
  addCartItemBodySchema,
  cartSchema,
  couponBodySchema,
  setCartCepBodySchema,
  setShippingMethodBodySchema,
  updateCartItemBodySchema,
} from '@timbre/contracts'
import type { Router } from '../core.js'
import { optionalUser, resolveCart } from '../auth.js'
import { ApiError, errors } from '../errors.js'
import { availableStock, findVariantOption } from '../mappers.js'
import { requestCurrency } from '../currency.js'
import { assertCouponApplies, buildCart, priceCart } from '../pricing.js'
import { lookupCep } from '../shipping.js'
import type { Store } from '../store.js'
import { parseBody, send } from '../validate.js'

export function registerCartRoutes(app: Router, store: Store): void {
  app.get('/api/cart', async (request, reply) => {
    const cart = resolveCart(store, request, optionalUser(store, request))
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
  })

  app.post('/api/cart/items', async (request, reply) => {
    const body = parseBody(addCartItemBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const product = store.productById(body.productId)
    if (!product) throw errors.notFound('Product not found.')

    if (product.variants && !body.variantOptionId) {
      throw errors.validation({ variantOptionId: 'Choose a product option.' })
    }
    if (!product.variants && body.variantOptionId) {
      throw errors.validation({ variantOptionId: 'This product has no options.' })
    }
    if (body.variantOptionId && !findVariantOption(product, body.variantOptionId)) {
      throw errors.notFound('Product option not found.')
    }

    const variantOptionId = body.variantOptionId ?? null
    const available = availableStock(product, variantOptionId)
    const existing = cart.lines.find(
      (line) => line.productId === product.id && line.variantOptionId === variantOptionId,
    )
    const wanted = (existing?.quantity ?? 0) + body.quantity
    if (wanted > available) {
      throw new ApiError(
        'INSUFFICIENT_STOCK',
        available === 0
          ? 'This product is sold out.'
          : `Only ${available} unit(s) of this product left.`,
        { available },
      )
    }

    if (existing) {
      existing.quantity = wanted
    } else {
      cart.lines.push({
        id: store.nextLineId(),
        productId: product.id,
        variantOptionId,
        quantity: body.quantity,
      })
    }
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)), 201)
  })

  app.patch<{ Params: { lineId: string } }>('/api/cart/items/:lineId', async (request, reply) => {
    const body = parseBody(updateCartItemBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const line = cart.lines.find((candidate) => candidate.id === request.params.lineId)
    if (!line) throw errors.notFound('Item not found in the cart.')

    if (body.quantity === 0) {
      cart.lines = cart.lines.filter((candidate) => candidate.id !== line.id)
      return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
    }

    const product = store.productById(line.productId)
    if (!product) throw errors.notFound('Product not found.')
    const available = availableStock(product, line.variantOptionId)
    if (body.quantity > available) {
      throw new ApiError('INSUFFICIENT_STOCK', `Only ${available} unit(s) left.`, {
        available,
      })
    }
    line.quantity = body.quantity
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
  })

  app.delete<{ Params: { lineId: string } }>('/api/cart/items/:lineId', async (request, reply) => {
    const cart = resolveCart(store, request, optionalUser(store, request))
    const line = cart.lines.find((candidate) => candidate.id === request.params.lineId)
    if (!line) throw errors.notFound('Item not found in the cart.')
    cart.lines = cart.lines.filter((candidate) => candidate.id !== line.id)
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
  })

  app.post('/api/cart/coupon', async (request, reply) => {
    const body = parseBody(couponBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const priced = priceCart(store, cart, 'BRL')
    if (priced.cart.coupon) {
      throw new ApiError('COUPON_ALREADY_APPLIED', 'A coupon is already applied to this cart.')
    }
    const coupon = store.couponByCode(body.code)
    if (!coupon) throw new ApiError('COUPON_INVALID', 'Invalid coupon.')
    assertCouponApplies(store, coupon, priced.resolved, priced.brlSubtotal)
    cart.couponCode = coupon.code
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
  })

  app.delete('/api/cart/coupon', async (request, reply) => {
    const cart = resolveCart(store, request, optionalUser(store, request))
    cart.couponCode = null
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
  })

  app.put('/api/cart/cep', async (request, reply) => {
    const body = parseBody(setCartCepBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    lookupCep(store, body.cep)
    cart.cep = body.cep
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
  })

  app.put('/api/cart/shipping', async (request, reply) => {
    const body = parseBody(setShippingMethodBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const current = buildCart(store, cart, requestCurrency(request))
    const option = current.shippingOptions.find((candidate) => candidate.id === body.shippingId)
    if (!option) {
      throw new ApiError(
        'SHIPPING_OPTION_UNAVAILABLE',
        'This shipping method does not serve the given CEP.',
        { fields: { shippingId: 'Method unavailable for this CEP.' } },
      )
    }
    cart.selectedShippingId = option.id
    return send(reply, cartSchema, buildCart(store, cart, requestCurrency(request)))
  })
}
