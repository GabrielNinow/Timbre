export function cartReady(): void {
  cy.byTestId('cart-page').should('have.attr', 'data-state').and('match', /ready|empty/)
}

export function applyCoupon(code: string): void {
  cy.byTestId('coupon-input').clear().type(code)
  cy.byTestId('coupon-apply').click()
}

export function line(productId: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-testid="cart-line"][data-product-id="${productId}"]`)
}

export function price(testid: string): Cypress.Chainable<number> {
  return cy.byTestId(testid).invoke('attr', 'data-price').then(Number)
}
