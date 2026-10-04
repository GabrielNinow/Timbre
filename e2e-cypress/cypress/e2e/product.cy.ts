import { addToCart, chooseOption, openProduct, productReady, quoteShipping } from '../actions'

describe('product page', () => {
  it('p-0103: switching variants updates price, stock and ?option=', () => {
    openProduct('p-0103')
    cy.get('[data-testid="variant-option"][data-selected="true"]').should('have.attr', 'data-option-id', 'v-0103-butterscotch')
    chooseOption('v-0103-sonic-blue')
    cy.location('search').should('eq', '?option=v-0103-sonic-blue')
    cy.byTestId('product-price').should('have.attr', 'data-price', '344900')
    cy.byTestId('stock-notice').should('have.attr', 'data-stock', '2').and('have.attr', 'data-stock-state', 'low')
    cy.reload()
    productReady()
    cy.get('[data-testid="variant-option"][data-selected="true"]').should('have.attr', 'data-option-id', 'v-0103-sonic-blue')
  })

  it('p-0103: the sold-out Black is selectable but blocks buying, with a reason', () => {
    openProduct('p-0103')
    chooseOption('v-0103-black')
    cy.byTestId('buy-box').should('have.attr', 'data-blocked', 'sold-out-option')
    cy.byTestId('add-to-cart').should('be.disabled')
    cy.byTestId('buy-now').should('be.disabled')
    cy.byTestId('stock-notice').should('have.attr', 'data-stock-state', 'sold-out')
  })

  it('p-0101: caps the stepper at 1 with a visible notice, and refuses a second unit', () => {
    openProduct('p-0101')
    cy.byTestId('qty-increase').should('be.disabled')
    cy.byTestId('stock-limit-notice').should('be.visible')
    addToCart()
    cy.byTestId('cart-count').should('have.attr', 'data-count', '1')
    cy.byTestId('add-to-cart').click()
    cy.byTestId('add-to-cart-error').should('have.attr', 'data-error-code', 'INSUFFICIENT_STOCK')
  })

  it('p-0102: out of stock offers notify-me, which confirms in place', () => {
    openProduct('p-0102')
    cy.byTestId('add-to-cart').should('be.disabled')
    cy.byTestId('notify-me-email').type('not-an-email')
    cy.byTestId('notify-me-submit').click()
    cy.byTestId('field-error-notify-email').should('have.attr', 'data-error-code', 'VALIDATION_ERROR')
    cy.byTestId('notify-me-email').clear().type('ana.souza@timbre.test')
    cy.byTestId('notify-me-submit').click()
    cy.byTestId('notify-me-confirmation').should('contain.text', 'ana.souza@timbre.test')
  })

  it('estimates shipping for every CEP behaviour', () => {
    openProduct('p-0104')
    quoteShipping('69900-000')
    cy.byTestId('shipping-option').should('have.length', 1).and('have.attr', 'data-method', 'standard')
    quoteShipping('00000-000')
    cy.byTestId('field-error-shipping-cep').should('have.attr', 'data-error-code', 'CEP_NOT_FOUND')
    quoteShipping('99999-999')
    cy.byTestId('shipping-quote-error').should('exist')
    cy.byTestId('shipping-quote-error-retry').should('exist')
  })

  it('p-0602: renders the zero-review state', () => {
    openProduct('p-0602')
    cy.byTestId('product-reviews-empty').should('have.attr', 'data-state', 'empty')
  })

  it('renders unknown products as not-found', () => {
    cy.open('/p/nothing--p-9999')
    cy.byTestId('not-found').should('be.visible')
  })
})

describe('seller page', () => {
  it('s-08: renders the profile and its two listings without pagination', () => {
    cy.open('/s/vintage-room')
    cy.byTestId('seller-profile').should('have.attr', 'data-seller-id', 's-08')
    cy.get('[data-testid="results-grid"] [data-testid="product-card"]').should('have.length', 2)
    cy.byTestId('pagination').should('not.exist')
  })

  it('filters a seller listing through the URL', () => {
    cy.open('/s/casa-do-som')
    cy.byTestId('results-grid').should('exist')
    cy.get('[data-testid="filter-option"][data-facet="condition"][data-value="new"] input').click()
    cy.location('pathname').should('eq', '/s/casa-do-som')
    cy.location('search').should('eq', '?condition=new')
  })
})
