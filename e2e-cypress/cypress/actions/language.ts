export type PageLanguage = 'pt-BR' | 'en'
export const LANGUAGES: Array<{ language: PageLanguage; prefix: string; currency: 'BRL' | 'USD' }> = [
  { language: 'pt-BR', prefix: '', currency: 'BRL' },
  { language: 'en', prefix: '/en', currency: 'USD' },
]

/** Runs one journey under both Page languages (ADR 0001). */
export function inEveryLanguage(title: string, body: (language: (typeof LANGUAGES)[number]) => void): void {
  for (const language of LANGUAGES) {
    it(`${title} [${language.language}]`, () => body(language))
  }
}

export function switchLanguage(language: PageLanguage): void {
  cy.byTestId('language-option').filter(`[data-language="${language}"]`).click()
}

/** USD cents for a BRL price, by the Demo exchange rate (ADR 0002). */
export const toUsd = (brl: number): number => Math.floor((brl * 2 + 5) / 10)
