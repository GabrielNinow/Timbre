import QuantityStepper from '@/components/base/QuantityStepper.vue'

describe('QuantityStepper', () => {
  it('increments and decrements within its bounds', () => {
    const onUpdate = cy.spy().as('update')
    cy.mountWithApp(QuantityStepper, { props: { testid: 'qty', modelValue: 2, max: 5, 'onUpdate:modelValue': onUpdate } })
    cy.byTestId('qty-increase').click()
    cy.get('@update').should('have.been.calledWith', 3)
    cy.byTestId('qty-decrease').click()
    cy.get('@update').should('have.been.calledWith', 1)
  })

  it('disables increment at the cap with a visible notice (the p-0101 case)', () => {
    cy.mountWithApp(QuantityStepper, { props: { testid: 'qty', modelValue: 1, max: 1, noticeTestid: 'stock-limit-notice' } })
    cy.byTestId('qty-increase').should('be.disabled')
    cy.byTestId('qty-decrease').should('be.disabled')
    cy.byTestId('stock-limit-notice').should('be.visible')
  })

  it('clamps a typed value to the cap', () => {
    const onUpdate = cy.spy().as('update')
    cy.mountWithApp(QuantityStepper, { props: { testid: 'qty', modelValue: 1, max: 4, 'onUpdate:modelValue': onUpdate } })
    cy.byTestId('qty-input').clear().type('9').blur()
    cy.get('@update').should('have.been.calledWith', 4)
  })

  it('is fully inert when nothing is available', () => {
    cy.mountWithApp(QuantityStepper, { props: { testid: 'qty', modelValue: 1, max: 0 } })
    cy.byTestId('qty-increase').should('be.disabled')
    cy.byTestId('qty-input').should('be.disabled')
  })
})
