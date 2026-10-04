import {
  orderListResponseSchema,
  orderSchema,
  type CreateOrderBody,
  type Currency,
  type Order,
} from '@timbre/contracts'
import { apiGet, apiSend } from '@/api/client'

export function createOrder(body: CreateOrderBody, currency: Currency): Promise<Order> {
  return apiSend('/orders', orderSchema, {
    method: 'POST',
    body,
    params: new URLSearchParams(currency === 'BRL' ? {} : { currency }),
  })
}

export function fetchOrder(id: string, signal?: AbortSignal): Promise<Order> {
  return apiGet(`/orders/${encodeURIComponent(id)}`, orderSchema, { signal })
}

export async function fetchOrders(signal?: AbortSignal): Promise<Order[]> {
  return (await apiGet('/orders', orderListResponseSchema, { signal })).items
}
