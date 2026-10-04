import { CARD_OUTCOMES } from '@timbre/contracts'
import type { Page } from '@playwright/test'
import { draft, expect, test } from '../support/fixtures'

const GOOD_CARD = '4111111111111111'
const DECLINES = Object.entries(CARD_OUTCOMES).filter(([, outcome]) => outcome !== 'approved')

async function payByCard(page: Page, number: string) {
  await page.getByTestId('field-cardNumber').fill(number)
  await page.getByTestId('field-cardHolder').fill('ANA SOUZA')
  await page.getByTestId('field-cardExpiry').fill('1230')
  await page.getByTestId('field-cardCvv').fill('123')
  await page.getByTestId('payment-submit').click()
  await expect(page).toHaveURL(/\/checkout\/review$/)
}
async function placeOrder(page: Page) {
  await page.getByTestId('field-terms').check()
  await page.getByTestId('place-order').click()
}

test.describe('checkout', () => {
  test.use({ account: 'ana' })
  test.beforeEach(async ({ seed }) => {
    await seed.cart([{ productId: 'p-0104' }])
  })

  test('validates the address on blur and submit, and looks up the CEP', async ({ page }) => {
    await page.goto('/checkout/shipping')
    await page.getByTestId('field-recipient').focus()
    await page.getByTestId('field-recipient').blur()
    await expect(page.getByTestId('field-error-recipient')).toBeVisible()
    await expect(page.getByTestId('form-error-summary')).toHaveCount(0)
    await page.getByTestId('shipping-submit').click()
    await expect(page.getByTestId('form-error-summary')).toHaveAttribute('role', 'alert')
    await expect(page.getByTestId('field-recipient')).toBeFocused()
    await page.getByTestId('field-cep').fill('00000-000')
    await page.getByTestId('field-cep').blur()
    await expect(page.getByTestId('field-error-cep')).toHaveAttribute('data-error-code', 'CEP_NOT_FOUND')
    await page.getByTestId('field-cep').fill('99999-999')
    await page.getByTestId('field-cep').blur()
    await expect(page.getByTestId('cep-lookup-error-retry')).toBeVisible()
    await page.getByTestId('field-cep').fill('01310-100')
    await page.getByTestId('field-cep').blur()
    await expect(page.getByTestId('field-city')).toHaveValue('São Paulo')
  })

  test('pays by card end to end and decrements stock', async ({ page, request, api }) => {
    const before = ((await (await request.get(`${api.url}/api/products/p-0104`)).json()) as { stock: number }).stock
    await page.goto('/checkout/shipping')
    await page.getByTestId('field-recipient').fill('Ana Souza')
    await page.getByTestId('field-cep').fill('89010-000')
    await page.getByTestId('field-cep').blur()
    await expect(page.getByTestId('field-city')).toHaveValue('Blumenau')
    await page.getByTestId('field-street').fill('Rua XV de Novembro')
    await page.getByTestId('field-number').fill('1400')
    await page.getByTestId('field-district').fill('Centro')
    await page.getByTestId('shipping-submit').click()
    await expect(page).toHaveURL(/\/checkout\/payment$/)
    await payByCard(page, GOOD_CARD)
    await placeOrder(page)
    await expect(page.getByTestId('order-number')).toHaveText('TMB-100241')
    await expect(page.getByTestId('order-status')).toHaveAttribute('data-status', 'paid')
    const after = ((await (await request.get(`${api.url}/api/products/p-0104`)).json()) as { stock: number }).stock
    expect(after).toBe(before - 1)
  })

  for (const [number, code] of DECLINES) {
    test(`${code}: errors at review, keeps the cart, a good card succeeds`, async ({ page, seed }) => {
      await seed.checkout(draft('card', false))
      await page.goto('/checkout/payment')
      await payByCard(page, number)
      await placeOrder(page)
      await expect(page.getByTestId('payment-error')).toHaveAttribute('data-error-code', code)
      await expect(page.getByTestId('checkout-summary-line')).toHaveCount(1)
      await page.getByTestId('review-change-payment').click()
      await payByCard(page, GOOD_CARD)
      await placeOrder(page)
      await expect(page.getByTestId('order-status')).toHaveAttribute('data-status', 'paid')
    })
  }

  test('renders the Pix payload', async ({ page, seed }) => {
    await seed.checkout(draft('pix'))
    await page.goto('/checkout/review')
    await placeOrder(page)
    await expect(page.getByTestId('pix-payload')).toContainText('TIMBRE-PIX-100241')
  })

  test('page.clock: the boleto countdown follows the injected clock', async ({ page, seed }) => {
    await seed.clock('2026-08-10T12:00:00Z')
    await seed.checkout(draft('boleto'))
    await page.goto('/checkout/review')
    await placeOrder(page)
    await expect(page.getByTestId('boleto-due-date')).toHaveAttribute('data-date', '2026-08-13')
    await expect(page.getByTestId('boleto-due-date')).toHaveAttribute('data-days-remaining', '3')
  })

  test('TMB-100238 is forbidden for a non-owner', async ({ page }) => {
    await page.goto('/orders/TMB-100238')
    await expect(page.getByTestId('order-forbidden')).toHaveAttribute('data-error-code', 'FORBIDDEN')
  })
})
