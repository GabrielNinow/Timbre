import { createI18n } from 'vue-i18n'
import { DEFAULT_LANGUAGE, type PageLanguage } from '@/lib/language'
import en from '@/locales/en.json'
import ptBR from '@/locales/pt-BR.json'

export type MessageSchema = typeof ptBR

export const DEFAULT_LOCALE = DEFAULT_LANGUAGE

export const i18n = createI18n<[MessageSchema], PageLanguage, false>({
  legacy: false,
  locale: DEFAULT_LANGUAGE,
  fallbackLocale: DEFAULT_LANGUAGE,
  messages: { 'pt-BR': ptBR, en },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
  missing: (locale, key) => {
    if (import.meta.env.DEV) {
      console.error(`[i18n] chave ausente em ${locale}: ${key}`)
    }
    return key
  },
})

export const t = i18n.global.t

/** Called on every navigation: the address decides the Page language. */
export function applyPageLanguage(language: PageLanguage): void {
  i18n.global.locale.value = language
  if (typeof document !== 'undefined') document.documentElement.lang = language
}
