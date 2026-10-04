import type { CheckoutDraftSeed } from '../support/types'

export const ADDRESS = {
  recipient: 'Ana Souza',
  cep: '89010000',
  street: 'Rua XV de Novembro',
  number: '1400',
  complement: '',
  district: 'Centro',
  city: 'Blumenau',
  state: 'SC' as const,
}

export const GOOD_CARD = '4111111111111111'

/** A draft as if the shipping step were done: tests start at payment or review. */
export function draft(method: CheckoutDraftSeed['method'], paymentDone = method !== null): CheckoutDraftSeed {
  return { address: ADDRESS, method, shippingDone: true, paymentDone }
}

export function fillCard(number: string, expiry = '1230', cvv = '123'): void {
  cy.byTestId('field-cardNumber').clear().type(number)
  cy.byTestId('field-cardHolder').clear().type('ANA SOUZA')
  cy.byTestId('field-cardExpiry').clear().type(expiry)
  cy.byTestId('field-cardCvv').clear().type(cvv)
}

export function payByCard(number: string): void {
  fillCard(number)
  cy.byTestId('payment-submit').click()
  cy.location('pathname').should('match', /\/checkout\/review$/)
}

export function placeOrder(): void {
  cy.byTestId('field-terms').check()
  cy.byTestId('place-order').click()
}
