import { applyCoupon, cartReady, line, price } from '../actions'

describe('cart', () => {
  it('increments an existing line instead of duplicating it', () => {
    cy.seedCart([{ productId: 'p-0104' }, { productId: 'p-0104' }])
    cy.open('/cart')
    cartReady()
    cy.byTestId('cart-line').should('have.length', 1)
    line('p-0104').find('[data-testid="cart-line-qty-input"]').should('have.value', '2')
    cy.byTestId('cart-count').should('have.attr', 'data-count', '2').and('have.attr', 'aria-live', 'polite')
  })

  it('mutates quantity on the server and survives a reload', () => {
    cy.seedCart([{ productId: 'p-0104' }])
    cy.open('/cart')
    cartReady()
    cy.byTestId('cart-line-qty-increase').click()
    cy.byTestId('cart-line-total').should('have.attr', 'data-price', String(2 * 129900))
    cy.reload()
    cartReady()
    cy.byTestId('cart-line-qty-input').should('have.value', '2')
  })

  it('groups lines by seller', () => {
    cy.seedCart([{ productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue' }, { productId: 'p-0602' }, { productId: 'p-0104' }])
    cy.open('/cart')
    cartReady()
    cy.byTestId('cart-seller-group').should('have.length', 2)
  })

  it('surfaces INSUFFICIENT_STOCK with the count when stock changes under an open page', () => {
    cy.seedCart([{ productId: 'p-0104' }])
    cy.open('/cart')
    cartReady()
    // Another buyer takes the whole stock.
    cy.request('POST', '/api/test/session', { email: 'bruno.lima@timbre.test' }).then(({ body }) => {
      const headers = { authorization: `Bearer ${body.token}` }
      cy.request({ method: 'POST', url: '/api/cart/items', headers, body: { productId: 'p-0104', quantity: 6 } })
      cy.request({
        method: 'POST',
        url: '/api/orders',
        headers,
        body: { shipping: { recipient: 'Bruno', cep: '89010000', street: 'Rua', number: '1', complement: '', district: 'Centro', city: 'Blumenau', state: 'SC' }, selectedShippingId: 'standard', payment: { method: 'pix' } },
      })
    })
    cy.byTestId('cart-line-qty-increase').click()
    cy.byTestId('cart-line-error').should('have.attr', 'data-error-code', 'INSUFFICIENT_STOCK')
  })

  it('ships standard for free from R$ 300,00, and FRETEGRATIS zeroes express', () => {
    cy.seedCart([{ productId: 'p-0602' }])
    cy.open('/cart')
    cartReady()
    price('summary-shipping').should('eq', 2490)
    cy.get('[data-testid="shipping-method"][data-method="express"] input').check()
    price('summary-shipping').should('eq', 4990)
    applyCoupon('FRETEGRATIS')
    cy.byTestId('coupon-applied').should('exist')
    price('summary-shipping').should('eq', 0)
    cy.resetStore()
    cy.seedCart([{ productId: 'p-0104' }])
    cy.open('/cart')
    cartReady()
    price('summary-shipping').should('eq', 0)
  })

  it('renders the empty state after the last line is removed', () => {
    cy.seedCart([{ productId: 'p-0104' }])
    cy.open('/cart')
    cartReady()
    cy.byTestId('cart-line-remove').click()
    cy.byTestId('cart-empty').should('have.attr', 'data-state', 'empty')
    cy.byTestId('cart-count').should('have.attr', 'data-count', '0')
  })

  it('persists the header CEP to the cart and reshapes shipping methods', () => {
    cy.seedCart([{ productId: 'p-0602' }])
    cy.open('/cart')
    cartReady()
    cy.byTestId('cep-selector').click()
    cy.byTestId('cep-selector-input').clear().type('69900-000')
    cy.byTestId('cep-selector-submit').click()
    cy.get('[data-testid="shipping-method"][data-method="express"]').should('not.exist')
  })

  it('shows a notice when the API drops a coupon that stopped qualifying', () => {
    cy.seedCart([{ productId: 'p-0104' }]).then((cartId) => {
      cy.open('/cart')
      cartReady()
      applyCoupon('SOMENTENOVOS')
      cy.byTestId('coupon-applied').should('exist')
      cy.request({ method: 'POST', url: '/api/cart/items', headers: { 'x-cart-id': cartId }, body: { productId: 'p-0106', quantity: 1 } })
      line('p-0104').find('[data-testid="cart-line-qty-increase"]').click()
      cy.byTestId('coupon-dropped-notice').should('have.attr', 'data-code', 'SOMENTENOVOS')
    })
  })
})
