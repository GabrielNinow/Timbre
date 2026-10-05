import { errorEnvelopeSchema, type ErrorCode } from '@timbre/contracts'
import type { z } from 'zod'
import { readStored } from '@/lib/storage'

/** Failures the client detects on its own, before any envelope exists. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'MALFORMED_RESPONSE'

export class ApiError extends Error {
  readonly code: ErrorCode | ClientErrorCode
  readonly status: number | null
  readonly fields: Record<string, string>
  readonly available: number | null

  constructor(
    code: ErrorCode | ClientErrorCode,
    message: string,
    status: number | null,
    extra: { fields?: Record<string, string> | undefined; available?: number | undefined } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = extra.fields ?? {}
    this.available = extra.available ?? null
  }
}

export interface RequestOptions {
  params?: URLSearchParams
  signal?: AbortSignal
}

export interface SendOptions extends RequestOptions {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

const BASE = '/api'

/** Attaches the guest cart id and the session token, both from storage. */
function headers(hasBody: boolean): Record<string, string> {
  const out: Record<string, string> = { accept: 'application/json' }
  if (hasBody) out['content-type'] = 'application/json'
  const cartId = readStored('cart')
  if (cartId) out['x-cart-id'] = cartId
  const token = readStored('session')
  if (token) out.authorization = `Bearer ${token}`
  return out
}

async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  options: RequestOptions & { method?: string; body?: unknown },
): Promise<z.infer<T>> {
  const search = options.params && [...options.params.keys()].length > 0 ? `?${options.params}` : ''
  const init = {
    method: options.method ?? 'GET',
    headers: headers(options.body !== undefined),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }
  let response: { ok: boolean; status: number; json: () => Promise<unknown> }
  if (import.meta.env.VITE_DEMO === '1') {
    // The public demo: the API runs in this page (ADR 0004). Loaded only in that build.
    const { demoRequest } = await import('@/api/demo')
    const result = await demoRequest({ method: init.method, path: `${BASE}${path}`, search: search.slice(1), headers: init.headers, body: init.body })
    response = { ok: result.status < 400, status: result.status, json: async () => result.body }
  } else {
    try {
      response = await fetch(`${BASE}${path}${search}`, { ...init, signal: options.signal })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new ApiError('NETWORK_ERROR', 'Network failure.', null)
    }
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError('MALFORMED_RESPONSE', 'Unreadable response.', response.status)
  }

  if (!response.ok) {
    const envelope = errorEnvelopeSchema.safeParse(body)
    if (envelope.success) {
      throw new ApiError(envelope.data.error.code, envelope.data.error.message, response.status, {
        fields: envelope.data.error.fields,
        available: envelope.data.error.available,
      })
    }
    throw new ApiError('MALFORMED_RESPONSE', 'Error response outside the contract.', response.status)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError('MALFORMED_RESPONSE', 'Response outside the contract.', response.status)
  }
  return parsed.data
}

export function apiGet<T extends z.ZodType>(
  path: string,
  schema: T,
  options: RequestOptions = {},
): Promise<z.infer<T>> {
  return request(path, schema, options)
}

export function apiSend<T extends z.ZodType>(
  path: string,
  schema: T,
  options: SendOptions,
): Promise<z.infer<T>> {
  return request(path, schema, options)
}

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
