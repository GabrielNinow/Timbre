/**
 * The only client-side state (docs/testability.md): two ids that point at server
 * state. Storage can be missing or throw (private windows, blocked site data), so
 * every access is guarded and the app works without it.
 */
export const STORAGE_KEYS = { session: 'timbre.session', cart: 'timbre.cart', checkout: 'timbre.checkout' } as const
type Key = keyof typeof STORAGE_KEYS

/** The checkout draft is per tab (sessionStorage); the two ids persist (localStorage). */
function area(key: Key): Storage | undefined {
  return key === 'checkout' ? globalThis.sessionStorage : globalThis.localStorage
}

export function readStored(key: Key): string | null {
  try {
    return area(key)?.getItem(STORAGE_KEYS[key]) ?? null
  } catch {
    return null
  }
}

export function writeStored(key: Key, value: string | null): void {
  try {
    if (value === null) area(key)?.removeItem(STORAGE_KEYS[key])
    else area(key)?.setItem(STORAGE_KEYS[key], value)
  } catch {
    // Storage unavailable: the session or guest cart simply does not persist.
  }
}
