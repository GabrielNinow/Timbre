import {
  authResponseSchema,
  loginBodySchema,
  meResponseSchema,
  registerBodySchema,
} from '@timbre/contracts'
import type { FastifyInstance } from 'fastify'
import { mergeGuestCart, requireUser } from '../auth.js'
import { ApiError } from '../errors.js'
import { toUser } from '../mappers.js'
import type { Store } from '../store.js'
import { parseBody, send } from '../validate.js'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function registerAuthRoutes(app: FastifyInstance, store: Store): void {
  app.post('/api/auth/login', async (request, reply) => {
    const body = parseBody(loginBodySchema, request.body)
    const user = store.userByEmail(body.email)

    if (!user || user.password !== body.password) {
      throw new ApiError('INVALID_CREDENTIALS', 'Incorrect email or password.')
    }
    if (user.locked) {
      throw new ApiError('ACCOUNT_LOCKED', 'This account is locked. Contact support.')
    }
    if (user.loginDelayMs > 0) await delay(user.loginDelayMs)

    mergeGuestCart(store, request, user)
    return send(reply, authResponseSchema, { token: user.token, user: toUser(user) })
  })

  app.post('/api/auth/register', async (request, reply) => {
    const body = parseBody(registerBodySchema, request.body)
    if (store.userByEmail(body.email)) {
      throw new ApiError('EMAIL_TAKEN', 'Já existe uma conta com este e-mail.', {
        fields: { email: 'Já existe uma conta com este e-mail.' },
      })
    }
    const user = store.createUser(body)
    mergeGuestCart(store, request, user)
    return send(reply, authResponseSchema, { token: user.token, user: toUser(user) }, 201)
  })

  app.get('/api/auth/me', async (request, reply) => {
    const user = requireUser(store, request)
    return send(reply, meResponseSchema, { user: toUser(user) })
  })
}
