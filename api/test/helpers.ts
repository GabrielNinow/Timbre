import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import type { Store } from '../src/store.js'

export interface Harness {
  app: FastifyInstance
  store: Store
}

export async function createHarness(options: { testMode?: boolean } = {}): Promise<Harness> {
  return buildApp({ testMode: options.testMode ?? true })
}

export interface CallOptions {
  token?: string
  cartId?: string
  headers?: Record<string, string>
}

function authHeaders(options: CallOptions = {}): Record<string, string> {
  return {
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    ...(options.cartId ? { 'x-cart-id': options.cartId } : {}),
    ...options.headers,
  }
}

export async function get(app: FastifyInstance, url: string, options: CallOptions = {}) {
  return app.inject({ method: 'GET', url, headers: authHeaders(options) })
}

export async function post(
  app: FastifyInstance,
  url: string,
  payload: unknown,
  options: CallOptions = {},
) {
  return app.inject({ method: 'POST', url, payload: payload as object, headers: authHeaders(options) })
}

export async function patch(
  app: FastifyInstance,
  url: string,
  payload: unknown,
  options: CallOptions = {},
) {
  return app.inject({ method: 'PATCH', url, payload: payload as object, headers: authHeaders(options) })
}

export async function put(
  app: FastifyInstance,
  url: string,
  payload: unknown,
  options: CallOptions = {},
) {
  return app.inject({ method: 'PUT', url, payload: payload as object, headers: authHeaders(options) })
}

export async function del(app: FastifyInstance, url: string, options: CallOptions = {}) {
  return app.inject({ method: 'DELETE', url, headers: authHeaders(options) })
}

export function errorCodeOf(response: { json: () => unknown }): string {
  const body = response.json() as { error?: { code?: string } }
  return body.error?.code ?? '(sem código)'
}

export async function seedSession(app: FastifyInstance, email: string): Promise<string> {
  const response = await post(app, '/api/test/session', { email })
  const body = response.json() as { token: string }
  return body.token
}

export async function addItem(
  app: FastifyInstance,
  item: { productId: string; quantity?: number; variantOptionId?: string },
  options: CallOptions = {},
) {
  return post(
    app,
    '/api/cart/items',
    {
      productId: item.productId,
      quantity: item.quantity ?? 1,
      ...(item.variantOptionId ? { variantOptionId: item.variantOptionId } : {}),
    },
    options,
  )
}

export const APPROVED_CARD = {
  number: '4111 1111 1111 1111',
  holder: 'ANA SOUZA',
  expiry: '12/30',
  cvv: '123',
}

export const shippingAddress = {
  recipient: 'Ana Souza',
  cep: '89010-000',
  street: 'Rua XV de Novembro',
  number: '1400',
  complement: '',
  district: 'Centro',
  city: 'Blumenau',
  state: 'SC',
}

export function orderPayload(
  overrides: {
    cardNumber?: string
    method?: 'cartao' | 'pix' | 'boleto'
    selectedShippingId?: 'padrao' | 'expressa'
  } = {},
) {
  const method = overrides.method ?? 'cartao'
  return {
    shipping: shippingAddress,
    selectedShippingId: overrides.selectedShippingId ?? 'padrao',
    payment:
      method === 'cartao'
        ? { method, card: { ...APPROVED_CARD, ...(overrides.cardNumber ? { number: overrides.cardNumber } : {}) } }
        : { method },
  }
}

export function findFloats(value: unknown, path = '$'): string[] {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? [] : [`${path} = ${value}`]
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => findFloats(entry, `${path}[${index}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => findFloats(entry, `${path}.${key}`))
  }
  return []
}
