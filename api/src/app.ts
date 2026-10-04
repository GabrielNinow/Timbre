import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import { requestCurrency } from './currency.js'
import { ApiError, errors } from './errors.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerCartRoutes } from './routes/cart.js'
import { registerCatalogRoutes } from './routes/catalog.js'
import { registerCheckoutRoutes } from './routes/checkout.js'
import { registerOrderRoutes } from './routes/orders.js'
import { registerTestRoutes } from './routes/test-control.js'
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

export async function buildApp(options: BuildAppOptions = {}): Promise<TimbreApp> {
  const testMode = options.testMode ?? process.env.TIMBRE_TEST_MODE === '1'
  const store = options.store ?? new Store()
  const app = Fastify({ logger: options.logger ?? false })

  await app.register(cors, {
    origin: true,
    exposedHeaders: ['x-cart-id'],
    allowedHeaders: ['content-type', 'authorization', 'x-cart-id'],
  })

  // Validate `?currency=` before any route mutates state, so a bad value changes nothing.
  app.addHook('preValidation', async (request) => {
    if (request.url.startsWith('/api/')) requestCurrency(request)
  })

  app.addHook('onRequest', async (request) => {
    if (request.url.startsWith('/api/test/')) return
    const armed = store.takeFailure(request.method, request.url)
    if (armed) {
      throw new ApiError(armed.code, 'Simulated failure for testing.', { status: armed.status })
    }
  })

  registerCatalogRoutes(app, store)
  registerAuthRoutes(app, store)
  registerCartRoutes(app, store)
  registerCheckoutRoutes(app, store)
  registerOrderRoutes(app, store)
  if (testMode) registerTestRoutes(app, store)

  app.setNotFoundHandler(async (_request, reply) => {
    const error = errors.notFound('Route not found.')
    return reply.status(error.status).send(error.toEnvelope())
  })

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.status).send(error.toEnvelope())
    }
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const mapped = new ApiError(
        statusCode === 401 ? 'UNAUTHORIZED' : 'MALFORMED_REQUEST',
        'Malformed request.',
        { status: statusCode },
      )
      return reply.status(mapped.status).send(mapped.toEnvelope())
    }
    request.log.error(error)
    const internal = errors.internal()
    return reply.status(internal.status).send(internal.toEnvelope())
  })

  return { app, store }
}
