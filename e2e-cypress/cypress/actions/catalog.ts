export function search(term: string): void {
  cy.byTestId('search-input').clear().type(term)
  cy.byTestId('search-submit').click()
}

export function toggleFilter(facet: string, value: string): void {
  cy.get(`[data-testid="filter-option"][data-facet="${facet}"][data-value="${value}"]`).then(($option) => {
    const input = $option.find('input')
    cy.wrap(input.length ? input : $option).click()
  })
}

export function removeChip(facet: string, value?: string): void {
  cy.get(`[data-testid="filter-chip"][data-facet="${facet}"]${value ? `[data-value="${value}"]` : ''}`).click()
}

export function resultsReady(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.byTestId('results-state').should('have.attr', 'data-state').and('not.eq', 'loading')
}

export function resultCards(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="results-grid"] [data-testid="product-card"]')
}
