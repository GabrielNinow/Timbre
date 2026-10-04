import { expect, test } from '../support/fixtures'

const ready = async (page: import('@playwright/test').Page) =>
  expect(page.getByTestId('cart-page')).toHaveAttribute('data-state', /ready|empty/)
const priceOf = (page: import('@playwright/test').Page, testid: string) =>
  page.getByTestId(testid).getAttribute('data-price').then(Number)

test.describe('cart', () => {
  test('increments an existing line and counts units in the header', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0104' }, { productId: 'p-0104' }])
    await page.goto('/cart')
    await ready(page)
    await expect(page.getByTestId('cart-line')).toHaveCount(1)
    await expect(page.getByTestId('cart-line-qty-input')).toHaveValue('2')
    await expect(page.getByTestId('cart-count')).toHaveAttribute('data-count', '2')
    await expect(page.getByTestId('cart-count')).toHaveAttribute('aria-live', 'polite')
  })

  test('mutates on the server and survives a reload', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0104' }])
    await page.goto('/cart')
    await page.getByTestId('cart-line-qty-increase').click()
    await expect(page.getByTestId('cart-line-total')).toHaveAttribute('data-price', String(2 * 129900))
    await page.reload()
    await expect(page.getByTestId('cart-line-qty-input')).toHaveValue('2')
  })

  test('groups lines by seller', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0103', variantOptionId: 'v-0103-sonic-blue' }, { productId: 'p-0602' }, { productId: 'p-0104' }])
    await page.goto('/cart')
    await expect(page.getByTestId('cart-seller-group')).toHaveCount(2)
  })

  test('ships standard free from R$ 300,00; FRETEGRATIS zeroes express', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0602' }])
    await page.goto('/cart')
    await ready(page)
    expect(await priceOf(page, 'summary-shipping')).toBe(2490)
    await page.locator('[data-testid="shipping-method"][data-method="express"] input').check()
    await expect(page.getByTestId('summary-shipping')).toHaveAttribute('data-price', '4990')
    await page.getByTestId('coupon-input').fill('FRETEGRATIS')
    await page.getByTestId('coupon-apply').click()
    await expect(page.getByTestId('summary-shipping')).toHaveAttribute('data-price', '0')
  })

  test('renders the empty state after the last line goes', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0104' }])
    await page.goto('/cart')
    await page.getByTestId('cart-line-remove').click()
    await expect(page.getByTestId('cart-empty')).toHaveAttribute('data-state', 'empty')
  })

  test('the header CEP reshapes shipping methods', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0602' }])
    await page.goto('/cart')
    await ready(page)
    await page.getByTestId('cep-selector').click()
    await page.getByTestId('cep-selector-input').fill('69900-000')
    await page.getByTestId('cep-selector-submit').click()
    await expect(page.locator('[data-testid="shipping-method"][data-method="express"]')).toHaveCount(0)
  })
})
