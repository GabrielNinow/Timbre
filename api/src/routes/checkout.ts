import {
  CARD_OUTCOMES,
  cardBrandOf,
  createOrderBodySchema,
  orderSchema,
  shippingQuoteBodySchema,
  shippingQuoteResponseSchema,
  type ErrorCode,
  type Order,
  type OrderItem,
} from '@timbre/contracts'
import type { FastifyInstance } from 'fastify'
import { requireUser } from '../auth.js'
import { ApiError } from '../errors.js'
import { availableStock, findVariantOption } from '../mappers.js'
import { buildCart } from '../pricing.js'
import { buildShippingOptions, lookupCep } from '../shipping.js'
import type { Store, StoreProduct } from '../store.js'
import { parseBody, send } from '../validate.js'

const PAYMENT_MESSAGES: Record<string, string> = {
  CARD_DECLINED: 'Pagamento recusado pelo emissor do cartão.',
  INSUFFICIENT_FUNDS: 'Cartão sem limite disponível para esta compra.',
  CARD_EXPIRED: 'Cartão vencido. Confira a validade e tente de novo.',
  PAYMENT_PROCESSOR_ERROR: 'A operadora de pagamento falhou. Tente novamente.',
}

function addDays(isoInstant: string, days: number): string {
  const result = new Date(Date.parse(isoInstant) + days * 86_400_000)
  return result.toISOString().slice(0, 10)
}

function decrementStock(product: StoreProduct, variantOptionId: string | null, quantity: number) {
  if (variantOptionId) {
    const found = findVariantOption(product, variantOptionId)
    if (found) found.option.stock = Math.max(0, found.option.stock - quantity)
    return
  }
  product.stock = Math.max(0, (product.stock ?? 0) - quantity)
}

export function registerCheckoutRoutes(app: FastifyInstance, store: Store): void {
  app.post('/api/shipping/quote', async (request, reply) => {
    const body = parseBody(shippingQuoteBodySchema, request.body)
    const info = lookupCep(store, body.cep)
    return send(reply, shippingQuoteResponseSchema, {
      cep: info.cep,
      city: info.city,
      state: info.state,
      options: buildShippingOptions(info, { standardFree: false, allFree: false }),
    })
  })

  app.post('/api/orders', async (request, reply) => {
    const user = requireUser(store, request)
    const body = parseBody(createOrderBodySchema, request.body)
    const cart = store.cartForUser(user.id)
    cart.selectedShippingId = body.selectedShippingId
    const built = buildCart(store, cart)

    if (built.lines.length === 0) {
      throw new ApiError('CART_EMPTY', 'Seu carrinho está vazio.')
    }

    const option = built.shippingOptions.find(
      (candidate) => candidate.id === body.selectedShippingId,
    )
    if (!option) {
      throw new ApiError(
        'SHIPPING_OPTION_UNAVAILABLE',
        'Esta modalidade de entrega não atende o CEP informado.',
        { fields: { selectedShippingId: 'Modalidade indisponível para este CEP.' } },
      )
    }

    const staleLineIds = built.lines
      .filter((line) => {
        const product = store.productById(line.product.id)
        if (!product) return true
        return availableStock(product, line.variant?.optionId ?? null) < line.quantity
      })
      .map((line) => line.id)
    if (staleLineIds.length > 0) {
      throw new ApiError(
        'STOCK_CHANGED',
        'O estoque mudou enquanto você finalizava a compra.',
        { lineIds: staleLineIds },
      )
    }

    let cardBrand: Order['payment']['cardBrand'] = null
    let cardLast4: string | null = null
    if (body.payment.method === 'cartao') {
      const card = body.payment.card!
      const outcome = CARD_OUTCOMES[card.number as keyof typeof CARD_OUTCOMES] ?? 'approved'
      if (outcome !== 'approved') {
        throw new ApiError(outcome as ErrorCode, PAYMENT_MESSAGES[outcome] ?? 'Pagamento recusado.')
      }
      cardBrand = cardBrandOf(card.number)
      cardLast4 = card.number.slice(-4)
    }

    const number = store.nextOrderNumber()
    const items: OrderItem[] = built.lines.map((line, index) => ({
      id: `${number}-${index + 1}`,
      productId: line.product.id,
      slug: line.product.slug,
      name: line.product.name,
      imageUrl: line.product.imageUrl,
      variantName: line.variant?.optionName ?? null,
      sellerId: line.product.seller.id,
      sellerName: line.product.seller.name,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    }))

    const total = built.totals.subtotal - built.totals.couponDiscount + option.price
    const order: Order = {
      id: number,
      number,
      status: body.payment.method === 'cartao' ? 'pago' : 'aguardando_pagamento',
      createdAt: store.now,
      userId: user.id,
      items,
      coupon: built.coupon,
      shipping: {
        address: body.shipping,
        methodId: option.id,
        methodLabel: option.label,
        price: option.price,
        etaDays: option.etaDays,
      },
      payment: {
        method: body.payment.method,
        cardBrand,
        cardLast4,
        pixPayload:
          body.payment.method === 'pix'
            ? `00020126TIMBRE-PIX-${number.replace('TMB-', '')}5204000053039865405${(total / 100).toFixed(2)}5802BR`
            : null,
        boletoDueDate: body.payment.method === 'boleto' ? addDays(store.now, 3) : null,
        boletoLine:
          body.payment.method === 'boleto'
            ? `34191.79001 01043.510047 91020.150008 5 ${String(total).padStart(14, '0')}`
            : null,
      },
      totals: {
        subtotal: built.totals.subtotal,
        couponDiscount: built.totals.couponDiscount,
        shipping: option.price,
        total: Math.max(0, total),
      },
    }

    for (const line of built.lines) {
      const product = store.productById(line.product.id)
      if (product) decrementStock(product, line.variant?.optionId ?? null, line.quantity)
    }
    cart.lines = []
    cart.couponCode = null
    store.orders.push(order)

    return send(reply, orderSchema, order, 201)
  })
}
