import { coupons, FIXTURE_NOW, products } from '@timbre/fixtures'
import { applyCoupon, cartReady, price } from '../actions'

/**
 * The coupon matrix, generated from the fixtures rather than copied. Each coupon is
 * tried on carts that land on either side of its rules; the expected outcome is
 * derived from the documented rules (docs/api-contract.md, Coupons).
 */
const SHAPES = [
  { label: 'a cheap new item', productId: 'p-0602' },
  { label: 'a dear new item', productId: 'p-0105' },
  { label: 'a like-new item', productId: 'p-0106' },
]

function expectedOutcome(code: string, productId: string): string | null {
  const coupon = coupons.find((candidate) => candidate.code === code)!
  const product = products.find((candidate) => candidate.id === productId)!
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.parse(FIXTURE_NOW)) return 'COUPON_EXPIRED'
  if (coupon.minSubtotal !== null && product.price < coupon.minSubtotal) return 'COUPON_MIN_NOT_MET'
  if (coupon.onlyConditions && !coupon.onlyConditions.includes(product.condition)) return 'COUPON_NOT_APPLICABLE'
  return null
}

describe('coupon matrix', () => {
  for (const coupon of coupons) {
    for (const shape of SHAPES) {
      const expected = expectedOutcome(coupon.code, shape.productId)
      it(`${coupon.code} on ${shape.label} → ${expected ?? 'applied'}`, () => {
        cy.seedCart([{ productId: shape.productId }])
        cy.open('/cart')
        cartReady()
        applyCoupon(coupon.code)
        if (expected) {
          cy.byTestId('coupon-error').should('have.attr', 'data-error-code', expected)
          cy.byTestId('coupon-applied').should('not.exist')
        } else {
          cy.byTestId('coupon-applied').should('have.attr', 'data-code', coupon.code)
          if (coupon.kind === 'free-shipping') price('summary-shipping').should('eq', 0)
          else price('summary-discount').should('be.greaterThan', 0)
        }
      })
    }
  }

  it('refuses an unknown code with COUPON_INVALID', () => {
    cy.seedCart([{ productId: 'p-0104' }])
    cy.open('/cart')
    cartReady()
    applyCoupon('NAOEXISTE')
    cy.byTestId('coupon-error').should('have.attr', 'data-error-code', 'COUPON_INVALID')
  })

  it('allows one coupon at a time', () => {
    cy.seedCart([{ productId: 'p-0104' }]).then((cartId) => {
      cy.request({ method: 'POST', url: '/api/cart/coupon', headers: { 'x-cart-id': cartId }, body: { code: 'TIMBRE10' } })
      cy.request({ method: 'POST', url: '/api/cart/coupon', headers: { 'x-cart-id': cartId }, body: { code: 'PRIMEIRACOMPRA' }, failOnStatusCode: false })
        .its('body.error.code')
        .should('eq', 'COUPON_ALREADY_APPLIED')
    })
    cy.open('/cart')
    cartReady()
    cy.byTestId('coupon-applied').should('have.attr', 'data-code', 'TIMBRE10')
  })
})
