import type { FastifyReply } from 'fastify'
import { z } from 'zod'
import { ApiError, errors } from './errors.js'

const TEST_MODE = process.env.TIMBRE_TEST_MODE === '1'

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
    throw errors.malformed('O corpo da requisição deve ser um objeto JSON.')
  }
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const hasUnknownKeys = result.error.issues.some((issue) => issue.code === 'unrecognized_keys')
  if (hasUnknownKeys) {
    throw errors.malformed('A requisição contém campos desconhecidos.', fieldsFrom(result.error))
  }
  throw errors.validation(fieldsFrom(result.error))
}

export function parseQuery<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data ?? {})
  if (result.success) return result.data
  throw errors.validation(fieldsFrom(result.error), 'Parâmetros de busca inválidos.')
}

export function send<T extends z.ZodType>(
  reply: FastifyReply,
  schema: T,
  payload: z.input<T>,
  status = 200,
): FastifyReply {
  if (TEST_MODE) {
    const result = schema.safeParse(payload)
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
        .join('; ')
      throw new ApiError('INTERNAL_ERROR', `Resposta fora do contrato — ${detail}`)
    }
    return reply.status(status).send(result.data)
  }
  return reply.status(status).send(payload)
}
