import { createI18n } from 'vue-i18n'
import ptBR from '@/locales/pt-BR.json'

export type MessageSchema = typeof ptBR

export const DEFAULT_LOCALE = 'pt-BR'

export const i18n = createI18n<[MessageSchema], typeof DEFAULT_LOCALE>({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { 'pt-BR': ptBR },
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
