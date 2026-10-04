import { ACCOUNTS, draft } from '../actions'

/** axe on every route, both languages, zero wcag2a/wcag2aa violations (docs/testability.md). */
const ROUTES: Array<{ path: string; seed?: () => void }> = [
  { path: '/' },
  { path: '/search' },
  { path: '/search?q=zzzz' },
  { path: '/c/guitars' },
  { path: '/p/squier-classic-vibe-telecaster--p-0103' },
  { path: '/p/gibson-les-paul-studio-2018--p-0102' },
  { path: '/s/vintage-room' },
  { path: '/cart' },
  { path: '/cart', seed: () => cy.seedCart([{ productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue' }]) },
  { path: '/sign-in' },
  { path: '/sign-up' },
  { path: '/checkout/shipping', seed: () => { cy.seedSession(ACCOUNTS.ana); cy.seedCart([{ productId: 'p-0104' }]) } },
  { path: '/checkout/payment', seed: () => { cy.seedSession(ACCOUNTS.ana); cy.seedCart([{ productId: 'p-0104' }]); cy.seedCheckout(draft('card', false)) } },
  { path: '/checkout/review', seed: () => { cy.seedSession(ACCOUNTS.ana); cy.seedCart([{ productId: 'p-0104' }]); cy.seedCheckout(draft('pix')) } },
  { path: '/account/orders', seed: () => cy.seedSession(ACCOUNTS.bruno) },
  { path: '/orders/TMB-100236', seed: () => cy.seedSession(ACCOUNTS.bruno) },
  { path: '/nowhere' },
]

describe('accessibility', () => {
  for (const prefix of ['', '/en']) {
    for (const route of ROUTES) {
      const path = `${prefix}${route.path === '/' && prefix ? '' : route.path}` || '/'
      it(`${path}${route.seed ? ' (seeded)' : ''}`, () => {
        route.seed?.()
        cy.open(path)
        cy.get('main').should('exist')
        cy.get('[data-state="loading"]').should('not.exist')
        cy.injectAxe()
        cy.checkA11y(undefined, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }, (violations) => {
          cy.task('log', violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`).join('\n'))
        })
      })
    }
  }
})
