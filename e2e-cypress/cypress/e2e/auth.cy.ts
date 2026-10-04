import { ACCOUNTS, DEMO_PASSWORD, signedInAs, signInThroughForm } from '../actions'

/** The only spec that signs in through the UI (docs/testability.md). */
describe('auth', () => {
  it('guards checkout, signs in through the form and returns to the intended route', () => {
    cy.seedCart([{ productId: 'p-0104' }])
    cy.open('/checkout/shipping')
    cy.location('pathname').should('eq', '/sign-in')
    cy.location('search').then((search) => expect(decodeURIComponent(search)).to.eq('?redirect=/checkout/shipping'))
    cy.byTestId('login-submit').click()
    cy.byTestId('form-error-summary').should('have.attr', 'role', 'alert')
    cy.focused().should('have.attr', 'data-testid', 'field-email')
    signInThroughForm(ACCOUNTS.ana, DEMO_PASSWORD)
    cy.location('pathname').should('eq', '/checkout/shipping')
    signedInAs('Ana')
    // The guest cart merged into Ana's; its id is spent.
    cy.byTestId('cart-count').should('have.attr', 'data-count', '1')
    cy.window().then((win) => expect(win.localStorage.getItem('timbre.cart')).to.eq(null))
  })

  for (const [label, email, password, code] of [
    ['the locked account', ACCOUNTS.locked, DEMO_PASSWORD, 'ACCOUNT_LOCKED'],
    ['a wrong password', ACCOUNTS.ana, 'errada', 'INVALID_CREDENTIALS'],
    ['an unknown email, identically', 'ninguem@timbre.test', DEMO_PASSWORD, 'INVALID_CREDENTIALS'],
  ] as const) {
    it(`refuses ${label}`, () => {
      cy.request({ method: 'POST', url: '/api/auth/login', body: { email, password }, failOnStatusCode: false })
        .its('body.error.code')
        .should('eq', code)
      // Demo accounts are one click away; the form path is covered above.
      cy.open('/sign-in')
      cy.byTestId('sign-in-form').should('exist')
      cy.get('body').then(($body) => {
        const $button = $body.find(`[data-testid="demo-account-sign-in"][data-email="${email}"]`)
        if ($button.length && password === DEMO_PASSWORD) {
          cy.wrap($button).click()
          cy.byTestId('auth-error').should('have.attr', 'data-error-code', code)
        }
      })
    })
  }

  it('holds the slow account in a loading state for its whole delay', () => {
    cy.open('/sign-in')
    cy.get(`[data-testid="demo-account-sign-in"][data-email="${ACCOUNTS.slow}"]`).click()
    cy.get(`[data-testid="demo-account-sign-in"][data-email="${ACCOUNTS.slow}"]`).should('have.attr', 'data-loading', 'true')
    cy.location('pathname', { timeout: 6000 }).should('eq', '/')
    signedInAs('Login')
  })

  it('flags an email already in use on sign-up', () => {
    cy.open('/sign-up')
    cy.byTestId('field-name').type('Ana')
    cy.byTestId('field-email').type(ACCOUNTS.ana)
    cy.byTestId('field-password').type('Outra@1234')
    cy.byTestId('sign-up-submit').click()
    cy.byTestId('field-error-email').should('have.attr', 'data-error-code', 'EMAIL_TAKEN')
  })

  it('names the broken password rule on blur', () => {
    cy.open('/sign-up')
    cy.byTestId('field-password').type('semmaiuscula1!').blur()
    cy.byTestId('field-error-password').should('exist')
  })

  it('signs out back to a guest cart', () => {
    cy.seedSession(ACCOUNTS.bruno)
    cy.open('/account/orders')
    cy.byTestId('orders-list').should('exist')
    cy.get('[data-testid="header-account"][data-user-id]').click()
    cy.byTestId('sign-out').click()
    cy.location('pathname').should('eq', '/')
    cy.byTestId('header-account').should('contain.text', 'Entrar')
  })
})
