import '@/style.css'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from 'cypress/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { applyPageLanguage, i18n } from '@/i18n'
import type { PageLanguage } from '@/lib/language'

/** Mounts a component with what the app installs: i18n in a Page language, Pinia, a router. */
function mountWithApp(component: unknown, options: { props?: Record<string, unknown>; language?: PageLanguage } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }] })
  applyPageLanguage(options.language ?? 'pt-BR')
  void router.push(options.language === 'en' ? '/en' : '/')
  return mount(component as never, { props: options.props, global: { plugins: [i18n, pinia, router] } })
}

Cypress.Commands.add('mountWithApp', mountWithApp)
Cypress.Commands.add('byTestId', (testid: string) => cy.get(`[data-testid="${testid}"]`))

declare global {
  namespace Cypress {
    interface Chainable {
      mountWithApp: typeof mountWithApp
      byTestId(testid: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
