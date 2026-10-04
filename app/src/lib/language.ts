/**
 * Page language lives in the address alone (ADR 0001): Portuguese unprefixed,
 * English under `/en`. This module is the only place that reads or writes that
 * prefix; components and route helpers go through it.
 */

export const PAGE_LANGUAGES = ['pt-BR', 'en'] as const
export type PageLanguage = (typeof PAGE_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: PageLanguage = 'pt-BR'

/** The Currency follows the Page language (ADR 0002). */
export type PageCurrency = 'BRL' | 'USD'
export function currencyFor(language: PageLanguage): PageCurrency {
  return language === 'en' ? 'USD' : 'BRL'
}

/** The router's optional `:locale` param value for each language. */
const PARAM: Record<PageLanguage, string | undefined> = { 'pt-BR': undefined, en: 'en' }
const PREFIX = /^\/en(?=\/|$|\?|#)/

export function languageFromParam(param: unknown): PageLanguage {
  return param === 'en' ? 'en' : DEFAULT_LANGUAGE
}

export function languageParam(language: PageLanguage): string | undefined {
  return PARAM[language]
}

function split(path: string): { pathname: string; rest: string } {
  const index = path.search(/[?#]/)
  return index === -1
    ? { pathname: path, rest: '' }
    : { pathname: path.slice(0, index), rest: path.slice(index) }
}

export function languageOfPath(path: string): PageLanguage {
  return PREFIX.test(split(path).pathname) ? 'en' : DEFAULT_LANGUAGE
}

/** Removes the language prefix, keeping query and hash. Always returns an absolute path. */
export function stripLanguage(path: string): string {
  const { pathname, rest } = split(path)
  const bare = pathname.replace(PREFIX, '')
  return `${bare.startsWith('/') ? bare : `/${bare}`}${rest}`
}

/** Rewrites `path` into `language`, keeping query and hash. Idempotent. */
export function localizePath(path: string, language: PageLanguage): string {
  const bare = stripLanguage(path)
  if (language === DEFAULT_LANGUAGE) return bare
  const { pathname, rest } = split(bare)
  return `/en${pathname === '/' ? '' : pathname}${rest}`
}
