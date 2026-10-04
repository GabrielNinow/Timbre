import type { Facets } from '@timbre/contracts'
import FilterRail from '@/components/catalog/FilterRail.vue'
import { emptyListing } from '@/lib/listing'

const facets: Facets = {
  brand: [
    { value: 'Fender', count: 2 },
    { value: 'Gibson', count: 0 },
  ],
  condition: [
    { value: 'new', count: 24 },
    { value: 'like-new', count: 22 },
    { value: 'used', count: 14 },
  ],
  price: [
    { value: '0-20000', min: 0, max: 20000, count: 5 },
    { value: '400000+', min: 400000, max: null, count: 16 },
  ],
}
const categories = [{ id: 'c-01', slug: 'guitars', productCount: 14 }]

describe('FilterRail', () => {
  it('renders every facet with its counts as Platform copy', () => {
    cy.mountWithApp(FilterRail, { props: { state: emptyListing(), context: {}, facets, categories } })
    cy.get('[data-testid="filter-option"][data-facet="condition"][data-value="like-new"]').should('contain.text', 'Seminovo').and('have.attr', 'data-count', '22')
    cy.get('[data-testid="filter-option"][data-facet="category"][data-value="guitars"]').should('contain.text', 'Guitarras')
    cy.get('[data-testid="filter-option"][data-facet="price"][data-value="0-20000"]').should('contain.text', 'Até R$')
  })

  it('emits a new listing state, back on page 1, when a filter is toggled', () => {
    const onChange = cy.spy().as('change')
    cy.mountWithApp(FilterRail, { props: { state: { ...emptyListing(), page: 3 }, context: {}, facets, categories, onChange } })
    cy.get('[data-testid="filter-option"][data-facet="brand"][data-value="Fender"] input').click()
    cy.get('@change').should('have.been.calledWithMatch', { brands: ['Fender'], page: 1 })
  })

  it('disables an option with no results unless it is selected', () => {
    cy.mountWithApp(FilterRail, { props: { state: emptyListing(), context: {}, facets, categories } })
    cy.get('[data-testid="filter-option"][data-facet="brand"][data-value="Gibson"] input').should('be.disabled')
  })

  it('hides the category group on a category page', () => {
    cy.mountWithApp(FilterRail, { props: { state: emptyListing({ pinnedCategory: 'guitars' }), context: { pinnedCategory: 'guitars' }, facets, categories } })
    cy.get('[data-testid="filter-group"][data-facet="category"]').should('not.exist')
  })

  it('blocks a min above max without emitting', () => {
    const onChange = cy.spy().as('change')
    cy.mountWithApp(FilterRail, { props: { state: emptyListing(), context: {}, facets, categories, onChange } })
    cy.byTestId('filter-price-min').type('500')
    cy.byTestId('filter-price-max').type('200')
    cy.byTestId('filter-price-apply').click()
    cy.byTestId('field-error-price-max').should('have.attr', 'data-error-code', 'min-above-max')
    cy.get('@change').should('not.have.been.called')
  })

  it('speaks English on English pages', () => {
    cy.mountWithApp(FilterRail, { props: { state: emptyListing(), context: {}, facets, categories }, language: 'en' })
    cy.get('[data-testid="filter-option"][data-facet="condition"][data-value="like-new"]').should('contain.text', 'Like new')
  })
})
