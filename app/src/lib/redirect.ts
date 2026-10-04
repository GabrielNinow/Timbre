import { localizePath, type PageLanguage } from '@/lib/language'

/**
 * The guard round trip: `/sign-in?redirect=<encoded>` and back. Only same-origin
 * absolute paths are ever followed, so `redirect` can never send a Visitor away.
 */
export function signInLocation(target: string, language: PageLanguage): string {
  return `${localizePath('/sign-in', language)}?${new URLSearchParams({ redirect: target })}`
}

export function safeRedirect(raw: unknown, language: PageLanguage): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return localizePath('/', language)
  const unsafe =
    !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /^\/[^/?#]*:/.test(value)
  return unsafe ? localizePath('/', language) : value
}
