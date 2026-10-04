import { coupons, FIXTURE_NOW, products } from '@timbre/fixtures'
import { expect, test } from '../support/fixtures'

/** Generated from the fixtures, as in the Cypress suite: each coupon on carts either side of its rules. */
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

test.describe('coupon matrix', () => {
  for (const coupon of coupons) {
    for (const shape of SHAPES) {
      const expected = expectedOutcome(coupon.code, shape.productId)
      test(`${coupon.code} on ${shape.label} → ${expected ?? 'applied'}`, async ({ page, seed }) => {
        await seed.cart([{ productId: shape.productId }])
        await page.goto('/cart')
        await page.getByTestId('coupon-input').fill(coupon.code)
        await page.getByTestId('coupon-apply').click()
        if (expected) await expect(page.getByTestId('coupon-error')).toHaveAttribute('data-error-code', expected)
        else await expect(page.getByTestId('coupon-applied')).toHaveAttribute('data-code', coupon.code)
      })
    }
  }

  test('refuses an unknown code', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0104' }])
    await page.goto('/cart')
    await page.getByTestId('coupon-input').fill('NAOEXISTE')
    await page.getByTestId('coupon-apply').click()
    await expect(page.getByTestId('coupon-error')).toHaveAttribute('data-error-code', 'COUPON_INVALID')
  })
})
