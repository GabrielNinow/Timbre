import { removeChip, resultCards, resultsReady, search, toggleFilter } from '../actions'

describe('catalog: search, filters and listing states', () => {
  it('reconstructs a filtered, sorted, paginated listing from its URL alone', () => {
    const url = '/search?condition=new&condition=like-new&sort=price-asc&page=2'
    cy.open(url)
    resultsReady()
    resultCards().then(($cards) => {
      const first = [...$cards].map((card) => card.dataset.productId)
      cy.reload()
      resultsReady()
      resultCards().should(($again) => {
        expect([...$again].map((card) => card.dataset.productId)).to.deep.equal(first)
      })
    })
    cy.byTestId('filter-chip').should('have.length', 2)
    cy.byTestId('sort-select').should('have.attr', 'data-value', 'price-asc')
  })

  it('writes every filter change to the URL, the chips and the facet counts', () => {
    cy.open('/search')
    resultsReady()
    cy.get('[data-testid="filter-option"][data-facet="condition"][data-value="used"]').invoke('attr', 'data-count').then((usedBefore) => {
      toggleFilter('condition', 'new')
      cy.location('search').should('eq', '?condition=new')
      cy.get('[data-testid="filter-chip"][data-facet="condition"][data-value="new"]').should('exist')
      cy.get('[data-testid="filter-option"][data-facet="condition"][data-value="new"]').should('have.attr', 'data-selected', 'true')
      // Facets count against the other filters: a condition's own counts stay put.
      cy.get('[data-testid="filter-option"][data-facet="condition"][data-value="used"]').should('have.attr', 'data-count', usedBefore)
      cy.byTestId('results-count').should('have.attr', 'data-count', '24')
    })
    cy.go('back')
    cy.location('search').should('eq', '')
    cy.byTestId('filter-chip').should('not.exist')
  })

  it('removes one chip or all of them and returns to page 1', () => {
    cy.open('/search?brand=Fender&freeShipping=true&price=20000-50000&page=2')
    resultsReady()
    removeChip('brand', 'Fender')
    cy.location('search').should('eq', '?price=20000-50000&freeShipping=true')
    cy.byTestId('filter-clear-all').click()
    cy.location('search').should('eq', '')
  })

  it('validates a typed price range without firing a request', () => {
    cy.open('/search')
    resultsReady()
    cy.intercept('GET', '/api/products*').as('products')
    cy.byTestId('filter-price-min').type('500')
    cy.byTestId('filter-price-max').type('200')
    cy.byTestId('filter-price-apply').click()
    cy.byTestId('field-error-price-max').should('have.attr', 'data-error-code', 'min-above-max')
    cy.location('search').should('eq', '')
    cy.get('@products.all').should('have.length', 0)
    cy.byTestId('filter-price-min').clear().type('200')
    cy.byTestId('filter-price-max').clear().type('500')
    cy.byTestId('filter-price-apply').click()
    cy.location('search').should('eq', '?price=20000-50000')
    cy.get('[data-testid="filter-option"][data-facet="price"][data-value="20000-50000"]').should('have.attr', 'data-selected', 'true')
  })

  it('searches from the header and pins a category page', () => {
    cy.open('/')
    search('fender')
    cy.location('pathname').should('eq', '/search')
    cy.location('search').should('eq', '?q=fender')
    resultsReady()
    cy.open('/c/guitars')
    resultsReady()
    resultCards().should('have.length', 14)
    cy.get('[data-testid="filter-group"][data-facet="category"]').should('not.exist')
  })

  it('renders an unknown category as not-found', () => {
    cy.open('/c/trumpets')
    cy.byTestId('not-found').should('be.visible')
  })

  it('keeps sponsored listings in their labelled row only', () => {
    cy.open('/')
    cy.get('[data-testid="home-sponsored"] [data-testid="product-card"]').should('have.length', 6)
    cy.get('[data-testid="home-sponsored"] [data-badge="sponsored"]').should('have.length', 6)
    cy.open('/search')
    resultsReady()
    cy.get('[data-badge="sponsored"]').should('not.exist')
  })
})

describe('catalog: the three error-injection layers', () => {
  it('server-side arming: a real failure response, then a retry', () => {
    cy.armFailure('GET /api/products')
    cy.open('/search?q=fender')
    cy.byTestId('results-error').should('have.attr', 'data-error-code', 'INJECTED_FAILURE')
    cy.byTestId('results-error-retry').click()
    cy.byTestId('results-grid').should('have.attr', 'data-state', 'ready')
  })

  it('cy.intercept: malformed JSON the server cannot produce', () => {
    cy.intercept('GET', '/api/products*', { statusCode: 200, body: '{ not json', headers: { 'content-type': 'application/json' } })
    cy.open('/search')
    cy.byTestId('results-error').should('have.attr', 'data-error-code', 'MALFORMED_RESPONSE')
  })

  it('cy.intercept: a hung request keeps the skeleton, never a blank page', () => {
    cy.intercept('GET', '/api/products*', (request) => {
      request.on('response', (response) => {
        response.setDelay(60_000)
      })
    })
    cy.open('/search')
    cy.byTestId('results-skeleton').should('have.attr', 'data-state', 'loading')
    cy.byTestId('product-card-skeleton').should('have.length', 10)
    cy.byTestId('results-grid').should('not.exist')
  })

  it('cy.intercept: an empty result set for a query that would match', () => {
    // The real response, emptied: valid by the contract, impossible from the fixtures.
    cy.request('/api/products?q=fender&brand=Fender').then(({ body }) => {
      cy.intercept('GET', '/api/products*', { statusCode: 200, body: { ...body, items: [], total: 0 } })
    })
    cy.open('/search?q=fender&brand=Fender')
    cy.byTestId('results-empty').should('have.attr', 'data-state', 'empty')
    cy.byTestId('results-empty-clear').should('exist')
  })
})
