import type { Cart, CheckoutDraftSeed } from './types'

/**
 * API-seeded setup (docs/testability.md, Setup and teardown). Nothing here clicks
 * through the UI: state comes from the test-control endpoints, and the three
 * client-side keys are written before the app boots.
 */

interface SeededState {
  session?: string
  cartId?: string
  checkout?: CheckoutDraftSeed
}
let seeded: SeededState = {}

Cypress.Commands.add('byTestId', (testid: string, options?: Partial<Cypress.Loggable & Cypress.Timeoutable>) =>
  cy.get(`[data-testid="${testid}"]`, options),
)

Cypress.Commands.add('resetStore', () => {
  seeded = {}
  cy.request('POST', '/api/test/reset')
})

Cypress.Commands.add('seedSession', (email: string) => {
  cy.request<{ token: string }>('POST', '/api/test/session', { email }).then(({ body }) => {
    seeded.session = body.token
    return body.token
  })
})

Cypress.Commands.add('seedCart', (items: Array<{ productId: string; quantity?: number; variantOptionId?: string }>) => {
  const auth = seeded.session ? { authorization: `Bearer ${seeded.session}` } : {}
  cy.request<Cart>({ method: 'GET', url: '/api/cart', headers: auth }).then(({ body: cart }) => {
    const headers = seeded.session ? auth : { 'x-cart-id': cart.id }
    if (!seeded.session) seeded.cartId = cart.id
    for (const item of items) {
      cy.request({ method: 'POST', url: '/api/cart/items', headers, body: { quantity: 1, ...item } })
    }
    cy.wrap(cart.id)
  })
})

Cypress.Commands.add('seedCheckout', (draft: CheckoutDraftSeed) => {
  seeded.checkout = draft
})

Cypress.Commands.add('freezeClock', (iso: string) => {
  // Both clocks: the API's for boleto due dates, the browser's for countdowns.
  cy.request('POST', '/api/test/clock', { now: iso })
  cy.clock(Date.parse(iso), ['Date'])
})

Cypress.Commands.add('armFailure', (route: string, options: { times?: number; status?: number; code?: string } = {}) => {
  cy.request('POST', '/api/test/failure', { route, times: options.times ?? 1, status: options.status ?? 500, ...(options.code ? { code: options.code } : {}) })
})

Cypress.Commands.add('open', (path: string) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      if (seeded.session) win.localStorage.setItem('timbre.session', seeded.session)
      if (seeded.cartId) win.localStorage.setItem('timbre.cart', seeded.cartId)
      if (seeded.checkout) win.sessionStorage.setItem('timbre.checkout', JSON.stringify(seeded.checkout))
    },
  })
})

/** Waits for a list or page container to settle, never for a fixed time. */
Cypress.Commands.add('settled', (testid: string) =>
  cy.byTestId(testid).should('have.attr', 'data-state').and('not.eq', 'loading'),
)

declare global {
  namespace Cypress {
    interface Chainable {
      byTestId(testid: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElement>>
      resetStore(): Chainable<void>
      seedSession(email: string): Chainable<string>
      seedCart(items: Array<{ productId: string; quantity?: number; variantOptionId?: string }>): Chainable<string>
      seedCheckout(draft: CheckoutDraftSeed): Chainable<void>
      freezeClock(iso: string): Chainable<void>
      armFailure(route: string, options?: { times?: number; status?: number; code?: string }): Chainable<void>
      open(path: string): Chainable<Cypress.AUTWindow>
      settled(testid: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
