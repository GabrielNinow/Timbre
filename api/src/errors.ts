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
  malformed: (message = 'Malformed request.', fields?: Record<string, string>) =>
    new ApiError('MALFORMED_REQUEST', message, fields ? { fields } : {}),
  validation: (fields: Record<string, string>, message = 'Check the highlighted fields.') =>
    new ApiError('VALIDATION_ERROR', message, { fields }),
  unauthorized: (message = 'Sign in to continue.') => new ApiError('UNAUTHORIZED', message),
  forbidden: (message = 'This order does not belong to your account.') => new ApiError('FORBIDDEN', message),
  notFound: (message = 'We could not find what you are looking for.') => new ApiError('NOT_FOUND', message),
  internal: (message = 'Unexpected server failure.') => new ApiError('INTERNAL_ERROR', message),
}
