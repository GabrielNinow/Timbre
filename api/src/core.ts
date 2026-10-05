import { requestCurrency } from './currency.js'
import { ApiError, errors } from './errors.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerCartRoutes } from './routes/cart.js'
import { registerCatalogRoutes } from './routes/catalog.js'
import { registerCheckoutRoutes } from './routes/checkout.js'
import { registerOrderRoutes } from './routes/orders.js'
import { registerTestRoutes } from './routes/test-control.js'
import type { Store } from './store.js'
import { setResponseValidation } from './validate.js'

/**
 * The API without a web framework (ADR 0004). Handlers take a plain request and
 * produce a plain response, so the same code serves Fastify (dev, tests, CI) and
 * the in-browser transport of the public demo.
 */

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type Query = Record<string, string | string[] | undefined>

export interface ApiRequest<P = Record<string, string>> {
  method: Method
  /** Path plus query string, as received. */
  url: string
  path: string
  query: Query
  params: P
  /** Lower-cased header names. */
  headers: Record<string, string | undefined>
  body: unknown
}

export interface ApiResponse {
  status: number
  body: unknown
}

/** The reply object handlers receive; mirrors the bit of Fastify's they use. */
export class Reply {
  statusCode = 200
  payload: unknown = undefined
  status(code: number): this {
    this.statusCode = code
    return this
  }
  send(payload: unknown): this {
    this.payload = payload
    return this
  }
}

type Params<T> = T extends { Params: infer P } ? P : Record<string, string>
type Handler<T> = (request: ApiRequest<Params<T>>, reply: Reply) => Promise<unknown> | unknown

interface Route {
  method: Method
  pattern: RegExp
  keys: string[]
  handler: Handler<unknown>
}

export class Router {
  private readonly routes: Route[] = []

  private add<T>(method: Method, path: string, handler: Handler<T>): void {
    const keys: string[] = []
    const source = path.replace(/:([A-Za-z]+)/g, (_match, key: string) => {
      keys.push(key)
      return '([^/]+)'
    })
    this.routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler: handler as Handler<unknown> })
  }

  get<T = unknown>(path: string, handler: Handler<T>): void {
    this.add('GET', path, handler)
  }
  post<T = unknown>(path: string, handler: Handler<T>): void {
    this.add('POST', path, handler)
  }
  put<T = unknown>(path: string, handler: Handler<T>): void {
    this.add('PUT', path, handler)
  }
  patch<T = unknown>(path: string, handler: Handler<T>): void {
    this.add('PATCH', path, handler)
  }
  delete<T = unknown>(path: string, handler: Handler<T>): void {
    this.add('DELETE', path, handler)
  }

  match(method: Method, path: string): { handler: Handler<unknown>; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue
      const found = route.pattern.exec(path)
      if (!found) continue
      const params = Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(found[index + 1]!)]))
      return { handler: route.handler, params }
    }
    return null
  }
}

export interface CreateApiOptions {
  /** Mounts the test-control routes and validates every response against the contract. */
  testMode: boolean
}

export interface Api {
  handle(request: Omit<ApiRequest, 'params'>): Promise<ApiResponse>
}

function toResponse(error: unknown): ApiResponse {
  if (error instanceof ApiError) return { status: error.status, body: error.toEnvelope() }
  const statusCode = (error as { statusCode?: number }).statusCode
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    const mapped = new ApiError(statusCode === 401 ? 'UNAUTHORIZED' : 'MALFORMED_REQUEST', 'Malformed request.', {
      status: statusCode,
    })
    return { status: mapped.status, body: mapped.toEnvelope() }
  }
  const internal = errors.internal()
  return { status: internal.status, body: internal.toEnvelope() }
}

export function createApi(store: Store, options: CreateApiOptions): Api {
  setResponseValidation(options.testMode)
  const router = new Router()
  registerCatalogRoutes(router, store)
  registerAuthRoutes(router, store)
  registerCartRoutes(router, store)
  registerCheckoutRoutes(router, store)
  registerOrderRoutes(router, store)
  if (options.testMode) registerTestRoutes(router, store)

  return {
    async handle(raw) {
      try {
        // A bad `?currency=` is refused before any route runs, so it changes nothing.
        requestCurrency(raw)
        if (!raw.path.startsWith('/api/test/')) {
          const armed = store.takeFailure(raw.method, raw.url)
          if (armed) throw new ApiError(armed.code, 'Simulated failure for testing.', { status: armed.status })
        }
        const found = router.match(raw.method, raw.path)
        if (!found) throw errors.notFound('Route not found.')
        const reply = new Reply()
        const result = await found.handler({ ...raw, params: found.params }, reply)
        const sent = result instanceof Reply ? result : reply
        return { status: sent.statusCode, body: sent.payload }
      } catch (error) {
        return toResponse(error)
      }
    },
  }
}
