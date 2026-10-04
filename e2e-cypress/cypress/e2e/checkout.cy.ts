import { CARD_OUTCOMES } from '@timbre/contracts'
import { ACCOUNTS, draft, fillCard, GOOD_CARD, payByCard, placeOrder } from '../actions'

const DECLINES = Object.entries(CARD_OUTCOMES).filter(([, outcome]) => outcome !== 'approved')

describe('checkout', () => {
  beforeEach(() => {
    cy.seedSession(ACCOUNTS.ana)
    cy.seedCart([{ productId: 'p-0104' }])
  })

  it('validates the address on blur and on submit, and looks up the CEP', () => {
    cy.open('/checkout/shipping')
    cy.byTestId('field-recipient').focus().blur()
    cy.byTestId('field-error-recipient').should('exist')
    cy.byTestId('form-error-summary').should('not.exist')
    cy.byTestId('shipping-submit').click()
    cy.byTestId('form-error-summary').should('have.attr', 'role', 'alert')
    cy.focused().should('have.attr', 'data-testid', 'field-recipient')
    cy.byTestId('field-cep').type('00000-000').blur()
    cy.byTestId('field-error-cep').should('have.attr', 'data-error-code', 'CEP_NOT_FOUND')
    cy.byTestId('field-cep').clear().type('99999-999').blur()
    cy.byTestId('cep-lookup-error-retry').should('exist')
    cy.byTestId('field-cep').clear().type('01310-100').blur()
    cy.byTestId('field-city').should('have.value', 'São Paulo')
    cy.byTestId('field-state').should('have.attr', 'data-value', 'SP')
  })

  it('pays by card end to end and decrements stock', () => {
    cy.request('/api/products/p-0104').its('body.stock').then((before) => {
      cy.open('/checkout/shipping')
      cy.byTestId('field-recipient').type('Ana Souza')
      cy.byTestId('field-cep').type('89010-000').blur()
      cy.byTestId('field-city').should('have.value', 'Blumenau')
      cy.byTestId('field-street').type('Rua XV de Novembro')
      cy.byTestId('field-number').type('1400')
      cy.byTestId('field-district').type('Centro')
      cy.byTestId('shipping-submit').click()
      cy.location('pathname').should('eq', '/checkout/payment')
      cy.byTestId('field-cardNumber').type('4111111111111112').blur()
      cy.byTestId('field-error-cardNumber').should('exist')
      cy.byTestId('field-cardNumber').should('have.value', '4111 1111 1111 1112')
      payByCard(GOOD_CARD)
      placeOrder()
      cy.byTestId('order-number').should('have.text', 'TMB-100241')
      cy.byTestId('order-status').should('have.attr', 'data-status', 'paid')
      cy.request('/api/products/p-0104').its('body.stock').should('eq', before - 1)
    })
  })

  for (const [number, code] of DECLINES) {
    it(`${code}: errors at review without clearing the cart, then a good card succeeds`, () => {
      cy.seedCheckout(draft('card', false))
      cy.open('/checkout/payment')
      payByCard(number)
      placeOrder()
      cy.byTestId('payment-error').should('have.attr', 'data-error-code', code)
      cy.byTestId('checkout-summary-line').should('have.length', 1)
      cy.byTestId('cart-count').should('have.attr', 'data-count', '1')
      cy.byTestId('review-change-payment').click()
      payByCard(GOOD_CARD)
      placeOrder()
      cy.byTestId('order-status').should('have.attr', 'data-status', 'paid')
    })
  }

  it('requires the terms', () => {
    cy.seedCheckout(draft('pix'))
    cy.open('/checkout/review')
    cy.byTestId('place-order').click()
    cy.byTestId('field-error-terms').should('exist')
  })

  it('renders the Pix payload with a copy action', () => {
    cy.seedCheckout(draft('pix'))
    cy.open('/checkout/review')
    placeOrder()
    cy.byTestId('pix-payload').should('contain.text', 'TIMBRE-PIX-100241')
    cy.byTestId('order-status').should('have.attr', 'data-status', 'awaiting_payment')
  })

  it('cy.clock: the boleto countdown follows the injected clock', () => {
    cy.freezeClock('2026-08-10T12:00:00Z')
    cy.seedCheckout(draft('boleto'))
    cy.open('/checkout/review')
    placeOrder()
    cy.byTestId('boleto-due-date').should('have.attr', 'data-date', '2026-08-13').and('have.attr', 'data-days-remaining', '3')
    cy.byTestId('boleto-remaining').should('contain.text', '3')
  })

  it('sends a Visitor without card details back to payment', () => {
    cy.seedCheckout(draft('card'))
    cy.open('/checkout/review')
    cy.location('pathname').should('eq', '/checkout/payment')
    cy.byTestId('payment-error').should('have.attr', 'data-error-code', 'CARD_REENTRY')
  })

  it('keeps an empty cart out of checkout', () => {
    cy.resetStore()
    cy.seedSession(ACCOUNTS.ana)
    cy.open('/checkout/shipping')
    cy.location('pathname').should('eq', '/cart')
  })
})

describe('orders', () => {
  it('lists Bruno\'s three orders', () => {
    cy.seedSession(ACCOUNTS.bruno)
    cy.open('/account/orders')
    cy.byTestId('order-row').should('have.length', 3)
  })

  it('renders TMB-100238 as forbidden for someone who does not own it', () => {
    cy.seedSession(ACCOUNTS.ana)
    cy.open('/orders/TMB-100238')
    cy.byTestId('order-forbidden').should('have.attr', 'data-error-code', 'FORBIDDEN')
  })
})

void fillCard
