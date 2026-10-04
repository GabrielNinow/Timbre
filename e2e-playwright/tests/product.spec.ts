import { expect, openProduct, test } from '../support/fixtures'

test.describe('product page', () => {
  test('p-0103: variants update price, stock and ?option=', async ({ page, request, api }) => {
    await openProduct(page, request, api.url, 'p-0103')
    await expect(page.locator('[data-testid="variant-option"][data-selected="true"]')).toHaveAttribute('data-option-id', 'v-0103-butterscotch')
    await page.locator('[data-testid="variant-option"][data-option-id="v-0103-sonic-blue"]').click()
    await expect(page).toHaveURL(/\?option=v-0103-sonic-blue$/)
    await expect(page.getByTestId('product-price')).toHaveAttribute('data-price', '344900')
    await expect(page.getByTestId('stock-notice')).toHaveAttribute('data-stock', '2')
    await page.reload()
    await expect(page.locator('[data-testid="variant-option"][data-selected="true"]')).toHaveAttribute('data-option-id', 'v-0103-sonic-blue')
  })

  test('p-0103: the sold-out Black blocks buying, with a reason', async ({ page, request, api }) => {
    await openProduct(page, request, api.url, 'p-0103')
    await page.locator('[data-testid="variant-option"][data-option-id="v-0103-black"]').click()
    await expect(page.getByTestId('buy-box')).toHaveAttribute('data-blocked', 'sold-out-option')
    await expect(page.getByTestId('add-to-cart')).toBeDisabled()
    await expect(page.getByTestId('buy-now')).toBeDisabled()
  })

  test('p-0101: caps at 1 and refuses a second unit', async ({ page, request, api }) => {
    await openProduct(page, request, api.url, 'p-0101')
    await expect(page.getByTestId('qty-increase')).toBeDisabled()
    await expect(page.getByTestId('stock-limit-notice')).toBeVisible()
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByTestId('add-to-cart-toast')).toBeVisible()
    await expect(page.getByTestId('cart-count')).toHaveAttribute('data-count', '1')
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByTestId('add-to-cart-error')).toHaveAttribute('data-error-code', 'INSUFFICIENT_STOCK')
  })

  test('p-0102: notify-me validates and confirms in place', async ({ page, request, api }) => {
    await openProduct(page, request, api.url, 'p-0102')
    await expect(page.getByTestId('add-to-cart')).toBeDisabled()
    await page.getByTestId('notify-me-email').fill('not-an-email')
    await page.getByTestId('notify-me-submit').click()
    await expect(page.getByTestId('field-error-notify-email')).toHaveAttribute('data-error-code', 'VALIDATION_ERROR')
    await page.getByTestId('notify-me-email').fill('ana.souza@timbre.test')
    await page.getByTestId('notify-me-submit').click()
    await expect(page.getByTestId('notify-me-confirmation')).toContainText('ana.souza@timbre.test')
  })

  test('estimates shipping for every CEP behaviour', async ({ page, request, api }) => {
    await openProduct(page, request, api.url, 'p-0104')
    const quote = async (cep: string) => {
      await page.getByTestId('shipping-cep-input').fill(cep)
      await page.getByTestId('shipping-quote-submit').click()
    }
    await quote('69900-000')
    await expect(page.getByTestId('shipping-option')).toHaveCount(1)
    await expect(page.getByTestId('shipping-option')).toHaveAttribute('data-method', 'standard')
    await quote('00000-000')
    await expect(page.getByTestId('field-error-shipping-cep')).toHaveAttribute('data-error-code', 'CEP_NOT_FOUND')
    await quote('99999-999')
    await expect(page.getByTestId('shipping-quote-error-retry')).toBeVisible()
  })

  test('p-0602 zero reviews; unknown product is not-found', async ({ page, request, api }) => {
    await openProduct(page, request, api.url, 'p-0602')
    await expect(page.getByTestId('product-reviews-empty')).toHaveAttribute('data-state', 'empty')
    await page.goto('/p/nothing--p-9999')
    await expect(page.getByTestId('not-found')).toBeVisible()
  })

  test('s-08: seller page without pagination, filters through the URL', async ({ page }) => {
    await page.goto('/s/vintage-room')
    await expect(page.getByTestId('seller-profile')).toHaveAttribute('data-seller-id', 's-08')
    await expect(page.locator('[data-testid="results-grid"] [data-testid="product-card"]')).toHaveCount(2)
    await expect(page.getByTestId('pagination')).toHaveCount(0)
    await page.goto('/s/casa-do-som')
    await page.locator('[data-testid="filter-option"][data-facet="condition"][data-value="new"] input').check()
    await expect(page).toHaveURL(/\/s\/casa-do-som\?condition=new$/)
  })
})
