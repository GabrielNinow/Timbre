import { orderListResponseSchema, orderSchema } from '@timbre/contracts'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireUser } from '../auth.js'
import { errors } from '../errors.js'
import { paginate } from '../catalog.js'
import type { Store } from '../store.js'
import { parseQuery, send } from '../validate.js'

const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(60).default(10),
})

export function registerOrderRoutes(app: FastifyInstance, store: Store): void {
  app.get('/api/orders', async (request, reply) => {
    const user = requireUser(store, request)
    const query = parseQuery(orderListQuerySchema, request.query)
    const mine = store.orders
      .filter((order) => order.userId === user.id)
      .sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
      )
    return send(reply, orderListResponseSchema, {
      items: paginate(mine, query.page, query.perPage),
      page: query.page,
      perPage: query.perPage,
      total: mine.length,
    })
  })

  app.get<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
    const user = requireUser(store, request)
    const order = store.orderById(request.params.id)
    if (!order) throw errors.notFound('Order not found.')
    if (order.userId !== user.id) throw errors.forbidden()
    return send(reply, orderSchema, order)
  })
}
