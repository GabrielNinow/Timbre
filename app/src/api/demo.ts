import { createApi, type Method, type Query } from '@timbre/api/core'
import { Store } from '@timbre/api/store'
import { systemClock } from '@/composables/clock'
import { readStored, writeStored } from '@/lib/storage'

/**
 * The public demo's transport (ADR 0004): the real API handlers, running inside the
 * Visitor's browser. Nothing leaves the page; the store is saved after every change
 * to `localStorage['timbre.demo']` and restored on load. No test-control routes.
 */
const store = new Store()
try {
  const saved = readStored('demo')
  if (saved) store.restore(JSON.parse(saved))
} catch {
  // An unreadable snapshot: start from the fixtures.
}
const api = createApi(store, { testMode: false })

function queryOf(search: string): Query {
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of new URLSearchParams(search)) {
    const existing = query[key]
    query[key] = existing === undefined ? value : Array.isArray(existing) ? [...existing, value] : [existing, value]
  }
  return query
}

export async function demoRequest(input: {
  method: string
  path: string
  search: string
  headers: Record<string, string>
  body: string | undefined
}): Promise<{ status: number; body: unknown }> {
  // The demo shop lives in real time: boletos fall due three days from today.
  store.now = systemClock.nowIso()
  let body: unknown
  try {
    body = input.body === undefined ? undefined : JSON.parse(input.body)
  } catch {
    body = input.body
  }
  const response = await api.handle({
    method: input.method as Method,
    url: `${input.path}${input.search ? `?${input.search}` : ''}`,
    path: input.path,
    query: queryOf(input.search),
    headers: input.headers,
    body,
  })
  if (input.method !== 'GET') writeStored('demo', JSON.stringify(store.snapshot()))
  // A serialization round trip, as over a network: the page never shares objects with the store.
  return { status: response.status, body: JSON.parse(JSON.stringify(response.body ?? null)) }
}

/** "Reset demo": the fixtures again, and every key this site keeps. */
export function resetDemo(): void {
  for (const key of ['demo', 'session', 'cart', 'checkout'] as const) writeStored(key, null)
}
