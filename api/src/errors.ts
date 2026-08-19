import { errorStatusByCode, type ErrorCode, type ErrorEnvelope } from '@timbre/contracts'

export interface ApiErrorDetails {
  fields?: Record<string, string>
  available?: number
  lineIds?: string[]
  status?: number
}

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details: ApiErrorDetails

  constructor(code: ErrorCode, message: string, details: ApiErrorDetails = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = details.status ?? errorStatusByCode[code]
    this.details = details
  }

  toEnvelope(): ErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details.fields ? { fields: this.details.fields } : {}),
        ...(this.details.available !== undefined ? { available: this.details.available } : {}),
        ...(this.details.lineIds ? { lineIds: this.details.lineIds } : {}),
      },
    }
  }
}

export const errors = {
  malformed: (message = 'Requisição malformada.', fields?: Record<string, string>) =>
    new ApiError('MALFORMED_REQUEST', message, fields ? { fields } : {}),
  validation: (fields: Record<string, string>, message = 'Confira os campos destacados.') =>
    new ApiError('VALIDATION_ERROR', message, { fields }),
  unauthorized: (message = 'Faça login para continuar.') => new ApiError('UNAUTHORIZED', message),
  forbidden: (message = 'Este pedido não pertence à sua conta.') => new ApiError('FORBIDDEN', message),
  notFound: (message = 'Não encontramos o que você procura.') => new ApiError('NOT_FOUND', message),
  internal: (message = 'Falha inesperada no servidor.') => new ApiError('INTERNAL_ERROR', message),
}
