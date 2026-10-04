import { BRL_PER_USD, currencyQuerySchema, type Currency } from '@timbre/contracts'
import type { FastifyRequest } from 'fastify'
import { parseQuery } from './validate.js'

/**
 * Sellers price in reais; dollars are derived (ADR 0002). A BRL amount converts
 * once, rounded half-up to the cent, using integer arithmetic only.
 */
export function convert(centavos: number, currency: Currency): number {
  if (currency === 'BRL') return centavos
  return Math.floor((centavos * 2 + BRL_PER_USD) / (BRL_PER_USD * 2))
}

/** The `?currency=` of a request, BRL when omitted. Other query keys are ignored here. */
export function requestCurrency(request: FastifyRequest): Currency {
  const query = (request.query ?? {}) as Record<string, unknown>
  return parseQuery(currencyQuerySchema, { currency: query.currency }).currency
}
