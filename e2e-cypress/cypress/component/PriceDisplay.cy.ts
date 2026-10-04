import PriceDisplay from '@/components/base/PriceDisplay.vue'

describe('PriceDisplay', () => {
  it('renders R$ 39,90 through R$ 8.990,00', () => {
    cy.mountWithApp(PriceDisplay, { props: { price: 3990 } })
    cy.byTestId('price-display').should('have.attr', 'data-price', '3990').and('contain.text', '39').and('contain.text', '90')
    cy.mountWithApp(PriceDisplay, { props: { price: 899000 } })
    cy.byTestId('price-display').should('contain.text', '8.990')
  })

  it('keeps its width when the value changes (no layout shift between prices of equal digits)', () => {
    cy.mountWithApp(PriceDisplay, { props: { price: 111100 } }).then(({ wrapper }) => {
      cy.byTestId('price-display').invoke('outerWidth').then((first) => {
        void wrapper.setProps({ price: 888800 })
        cy.byTestId('price-display').should('contain.text', '8.888').invoke('outerWidth').should('eq', first)
      })
    })
  })

  it('shows a struck list price and the discount percentage', () => {
    cy.mountWithApp(PriceDisplay, { props: { price: 129990, listPrice: 158900 } })
    cy.byTestId('price-display-list').should('have.css', 'text-decoration-line', 'line-through')
    cy.byTestId('price-display').should('have.attr', 'data-discount-percent', '18')
  })

  it('formats dollars on English pages', () => {
    cy.mountWithApp(PriceDisplay, { props: { price: 25998 }, language: 'en' })
    cy.byTestId('price-display').should('contain.text', '$').and('contain.text', '259').and('not.contain.text', 'R$')
  })
})
