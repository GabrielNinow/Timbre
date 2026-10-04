export function productReady(): void {
  cy.byTestId('product-page').should('have.attr', 'data-state', 'ready')
}

export function chooseOption(optionId: string): void {
  cy.get(`[data-testid="variant-option"][data-option-id="${optionId}"]`).click()
}

export function addToCart(): void {
  cy.byTestId('add-to-cart').click()
  cy.byTestId('add-to-cart-toast').should('exist')
}

export function quoteShipping(cep: string): void {
  cy.byTestId('shipping-cep-input').clear().type(cep)
  cy.byTestId('shipping-quote-submit').click()
}

/** Opens `/p/:slug--:id`, reading the slug from the API rather than hardcoding it. */
export function openProduct(id: string, prefix = '', query = ''): void {
  cy.request<{ slug: string }>(`/api/products/${id}`).then(({ body }) => {
    cy.open(`${prefix}/p/${body.slug}--${id}${query}`)
  })
  productReady()
}
