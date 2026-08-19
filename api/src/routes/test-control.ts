import {
  testClockBodySchema,
  testClockResponseSchema,
  testFailureBodySchema,
  testFailureResponseSchema,
  testResetResponseSchema,
  testSessionBodySchema,
  testSessionResponseSchema,
} from '@timbre/contracts'
import type { FastifyInstance } from 'fastify'
import { errors } from '../errors.js'
import { toUser } from '../mappers.js'
import type { Store } from '../store.js'
import { parseBody, send } from '../validate.js'

export function registerTestRoutes(app: FastifyInstance, store: Store): void {
  app.post('/api/test/reset', async (_request, reply) => {
    const startedAt = performance.now()
    store.reset()
    const durationMs = Math.round(performance.now() - startedAt)
    return send(reply, testResetResponseSchema, { ok: true, durationMs })
  })

  app.post('/api/test/session', async (request, reply) => {
    const body = parseBody(testSessionBodySchema, request.body)
    const user = store.userByEmail(body.email)
    if (!user) throw errors.notFound('Não existe conta com este e-mail no fixture.')
    return send(reply, testSessionResponseSchema, { token: user.token, user: toUser(user) })
  })

  app.post('/api/test/clock', async (request, reply) => {
    const body = parseBody(testClockBodySchema, request.body)
    store.now = body.now
    return send(reply, testClockResponseSchema, { now: store.now })
  })

  app.post('/api/test/failure', async (request, reply) => {
    const body = parseBody(testFailureBodySchema, request.body)
    store.armFailure(body)
    return send(reply, testFailureResponseSchema, {
      armed: store.failures.map((failure) => ({
        route: failure.route,
        remaining: failure.remaining,
        status: failure.status,
        code: failure.code,
      })),
    })
  })
}
