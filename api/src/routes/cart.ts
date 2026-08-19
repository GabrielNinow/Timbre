import {
  addCartItemBodySchema,
  cartSchema,
  couponBodySchema,
  setCartCepBodySchema,
  setShippingMethodBodySchema,
  updateCartItemBodySchema,
} from '@timbre/contracts'
import type { FastifyInstance } from 'fastify'
import { optionalUser, resolveCart } from '../auth.js'
import { ApiError, errors } from '../errors.js'
import { availableStock, findVariantOption } from '../mappers.js'
import { assertCouponApplies, buildCart } from '../pricing.js'
import { lookupCep } from '../shipping.js'
import type { Store } from '../store.js'
import { parseBody, send } from '../validate.js'

export function registerCartRoutes(app: FastifyInstance, store: Store): void {
  app.get('/api/cart', async (request, reply) => {
    const cart = resolveCart(store, request, optionalUser(store, request))
    return send(reply, cartSchema, buildCart(store, cart))
  })

  app.post('/api/cart/items', async (request, reply) => {
    const body = parseBody(addCartItemBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const product = store.productById(body.productId)
    if (!product) throw errors.notFound('Produto não encontrado.')

    if (product.variants && !body.variantOptionId) {
      throw errors.validation({ variantOptionId: 'Escolha uma opção do produto.' })
    }
    if (!product.variants && body.variantOptionId) {
      throw errors.validation({ variantOptionId: 'Este produto não tem opções.' })
    }
    if (body.variantOptionId && !findVariantOption(product, body.variantOptionId)) {
      throw errors.notFound('Opção de produto não encontrada.')
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
          ? 'Este produto está esgotado.'
          : `Restam apenas ${available} unidade(s) deste produto.`,
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
    return send(reply, cartSchema, buildCart(store, cart), 201)
  })

  app.patch<{ Params: { lineId: string } }>('/api/cart/items/:lineId', async (request, reply) => {
    const body = parseBody(updateCartItemBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const line = cart.lines.find((candidate) => candidate.id === request.params.lineId)
    if (!line) throw errors.notFound('Item não encontrado no carrinho.')

    if (body.quantity === 0) {
      cart.lines = cart.lines.filter((candidate) => candidate.id !== line.id)
      return send(reply, cartSchema, buildCart(store, cart))
    }

    const product = store.productById(line.productId)
    if (!product) throw errors.notFound('Produto não encontrado.')
    const available = availableStock(product, line.variantOptionId)
    if (body.quantity > available) {
      throw new ApiError('INSUFFICIENT_STOCK', `Restam apenas ${available} unidade(s).`, {
        available,
      })
    }
    line.quantity = body.quantity
    return send(reply, cartSchema, buildCart(store, cart))
  })

  app.delete<{ Params: { lineId: string } }>('/api/cart/items/:lineId', async (request, reply) => {
    const cart = resolveCart(store, request, optionalUser(store, request))
    const line = cart.lines.find((candidate) => candidate.id === request.params.lineId)
    if (!line) throw errors.notFound('Item não encontrado no carrinho.')
    cart.lines = cart.lines.filter((candidate) => candidate.id !== line.id)
    return send(reply, cartSchema, buildCart(store, cart))
  })

  app.post('/api/cart/coupon', async (request, reply) => {
    const body = parseBody(couponBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const current = buildCart(store, cart)
    if (current.coupon) {
      throw new ApiError('COUPON_ALREADY_APPLIED', 'Já existe um cupom aplicado neste carrinho.')
    }

    const coupon = store.couponByCode(body.code)
    if (!coupon) throw new ApiError('COUPON_INVALID', 'Cupom inválido.')

    const resolvedLines = current.lines.map((line) => ({
      line,
      product: store.productById(line.product.id)!,
      variantOptionId: line.variant?.optionId ?? null,
    }))
    assertCouponApplies(store, coupon, resolvedLines, current.totals.subtotal)

    cart.couponCode = coupon.code
    return send(reply, cartSchema, buildCart(store, cart))
  })

  app.delete('/api/cart/coupon', async (request, reply) => {
    const cart = resolveCart(store, request, optionalUser(store, request))
    cart.couponCode = null
    return send(reply, cartSchema, buildCart(store, cart))
  })

  app.put('/api/cart/cep', async (request, reply) => {
    const body = parseBody(setCartCepBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    lookupCep(store, body.cep)
    cart.cep = body.cep
    return send(reply, cartSchema, buildCart(store, cart))
  })

  app.put('/api/cart/shipping', async (request, reply) => {
    const body = parseBody(setShippingMethodBodySchema, request.body)
    const cart = resolveCart(store, request, optionalUser(store, request))
    const current = buildCart(store, cart)
    const option = current.shippingOptions.find((candidate) => candidate.id === body.shippingId)
    if (!option) {
      throw new ApiError(
        'SHIPPING_OPTION_UNAVAILABLE',
        'Esta modalidade de entrega não atende o CEP informado.',
        { fields: { shippingId: 'Modalidade indisponível para este CEP.' } },
      )
    }
    cart.selectedShippingId = option.id
    return send(reply, cartSchema, buildCart(store, cart))
  })
}
