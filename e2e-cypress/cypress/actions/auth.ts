export const DEMO_PASSWORD = 'Teste@1234'
export const ACCOUNTS = {
  ana: 'ana.souza@timbre.test',
  bruno: 'bruno.lima@timbre.test',
  locked: 'bloqueado@timbre.test',
  slow: 'lento@timbre.test',
} as const

/** The one place the suite signs in through the UI is auth.cy.ts. Everything else seeds. */
export function signInThroughForm(email: string, password: string): void {
  cy.byTestId('field-email').clear().type(email)
  cy.byTestId('field-password').clear().type(password, { log: false })
  cy.byTestId('login-submit').click()
}

export function signedInAs(name: string): void {
  cy.get('[data-testid="header-account"][data-user-id]').should('contain.text', name)
}
