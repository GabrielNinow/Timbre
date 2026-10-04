import { errorEnvelopeSchema, type ErrorCode } from '@timbre/contracts'
import type { z } from 'zod'

/** Failures the client detects on its own, before any envelope exists. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'MALFORMED_RESPONSE'

export class ApiError extends Error {
  readonly code: ErrorCode | ClientErrorCode
  readonly status: number | null

  constructor(code: ErrorCode | ClientErrorCode, message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export interface RequestOptions {
  params?: URLSearchParams
  signal?: AbortSignal
}

const BASE = '/api'

export async function apiGet<T extends z.ZodType>(
  path: string,
  schema: T,
  options: RequestOptions = {},
): Promise<z.infer<T>> {
  const search = options.params && [...options.params.keys()].length > 0 ? `?${options.params}` : ''
  let response: Response
  try {
    response = await fetch(`${BASE}${path}${search}`, {
      headers: { accept: 'application/json' },
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('NETWORK_ERROR', 'Falha de rede.', null)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError('MALFORMED_RESPONSE', 'Resposta ilegível.', response.status)
  }

  if (!response.ok) {
    const envelope = errorEnvelopeSchema.safeParse(body)
    if (envelope.success) {
      throw new ApiError(envelope.data.error.code, envelope.data.error.message, response.status)
    }
    throw new ApiError('MALFORMED_RESPONSE', 'Resposta de erro fora do contrato.', response.status)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError('MALFORMED_RESPONSE', 'Resposta fora do contrato.', response.status)
  }
  return parsed.data
}

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
