import { z } from 'zod'
import { ApiError, errors } from './errors.js'

/** In test mode every response is checked against the contract before it leaves. */
let validateResponses = false
export function setResponseValidation(enabled: boolean): void {
  validateResponses = enabled
}

interface Reply {
  status(code: number): Reply
  send(payload: unknown): Reply
}

function fieldsFrom(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_'
    if (!(path in fields)) fields[path] = issue.message
  }
  return fields
}

export function parseBody<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw errors.malformed('The request body must be a JSON object.')
  }
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const hasUnknownKeys = result.error.issues.some((issue) => issue.code === 'unrecognized_keys')
  if (hasUnknownKeys) {
    throw errors.malformed('The request contains unknown fields.', fieldsFrom(result.error))
  }
  throw errors.validation(fieldsFrom(result.error))
}

export function parseQuery<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data ?? {})
  if (result.success) return result.data
  throw errors.validation(fieldsFrom(result.error), 'Invalid query parameters.')
}

export function send<T extends z.ZodType>(reply: Reply, schema: T, payload: z.input<T>, status = 200): Reply {
  if (validateResponses) {
    const result = schema.safeParse(payload)
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ')
      throw new ApiError('INTERNAL_ERROR', `Response violates the contract — ${detail}`)
    }
    return reply.status(status).send(result.data)
  }
  return reply.status(status).send(payload)
}
