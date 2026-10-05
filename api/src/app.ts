import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import { createApi, type Method, type Query } from './core.js'
import { ApiError, errors } from './errors.js'
import { Store } from './store.js'

export interface BuildAppOptions {
  testMode?: boolean
  store?: Store
  logger?: boolean
}

export interface TimbreApp {
  app: FastifyInstance
  store: Store
}

/** The Fastify adapter over the framework-free API (core.ts, ADR 0004). */
export async function buildApp(options: BuildAppOptions = {}): Promise<TimbreApp> {
  const testMode = options.testMode ?? process.env.TIMBRE_TEST_MODE === '1'
  const store = options.store ?? new Store()
  const api = createApi(store, { testMode })
  const app = Fastify({ logger: options.logger ?? false })

  await app.register(cors, {
    origin: true,
    exposedHeaders: ['x-cart-id'],
    allowedHeaders: ['content-type', 'authorization', 'x-cart-id'],
  })

  app.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    url: '/api/*',
    handler: async (request, reply) => {
      const headers = Object.fromEntries(
        Object.entries(request.headers).map(([name, value]) => [name, Array.isArray(value) ? value[0] : value]),
      )
      const response = await api.handle({
        method: request.method as Method,
        url: request.url,
        path: request.url.split('?')[0] ?? request.url,
        query: (request.query ?? {}) as Query,
        headers,
        body: request.body,
      })
      return reply.status(response.status).send(response.body)
    },
  })

  app.setNotFoundHandler(async (_request, reply) => {
    const error = errors.notFound('Route not found.')
    return reply.status(error.status).send(error.toEnvelope())
  })

  // Only Fastify's own failures land here (an unreadable JSON body, say); the core maps the rest.
  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ApiError) return reply.status(error.status).send(error.toEnvelope())
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const mapped = new ApiError(statusCode === 401 ? 'UNAUTHORIZED' : 'MALFORMED_REQUEST', 'Malformed request.', {
        status: statusCode,
      })
      return reply.status(mapped.status).send(mapped.toEnvelope())
    }
    request.log.error(error)
    const internal = errors.internal()
    return reply.status(internal.status).send(internal.toEnvelope())
  })

  return { app, store }
}
