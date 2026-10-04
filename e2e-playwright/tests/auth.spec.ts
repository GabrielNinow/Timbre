import { ACCOUNTS, DEMO_PASSWORD, expect, test } from '../support/fixtures'

/** The only spec that signs in through the UI. Everything else gets a storageState. */
test.describe('auth', () => {
  test('guards checkout, signs in through the form and returns', async ({ page, seed }) => {
    await seed.cart([{ productId: 'p-0104' }])
    await page.goto('/checkout/shipping')
    await expect(page).toHaveURL(/\/sign-in\?redirect=/)
    expect(decodeURIComponent(new URL(page.url()).search)).toBe('?redirect=/checkout/shipping')
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('form-error-summary')).toHaveAttribute('role', 'alert')
    await expect(page.getByTestId('field-email')).toBeFocused()
    await page.getByTestId('field-email').fill(ACCOUNTS.ana)
    await page.getByTestId('field-password').fill(DEMO_PASSWORD)
    await page.getByTestId('login-submit').click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/checkout/shipping')
    await expect(page.locator('[data-testid="header-account"][data-user-id]')).toContainText('Ana')
    await expect(page.getByTestId('cart-count')).toHaveAttribute('data-count', '1')
    expect(await page.evaluate(() => localStorage.getItem('timbre.cart'))).toBeNull()
  })

  for (const [label, email, code] of [
    ['the locked account', ACCOUNTS.locked, 'ACCOUNT_LOCKED'],
  ] as const) {
    test(`refuses ${label}`, async ({ page }) => {
      await page.goto('/sign-in')
      await page.locator(`[data-testid="demo-account-sign-in"][data-email="${email}"]`).click()
      await expect(page.getByTestId('auth-error')).toHaveAttribute('data-error-code', code)
    })
  }

  test('answers a wrong password and an unknown email identically', async ({ request, api }) => {
    const wrong = await request.post(`${api.url}/api/auth/login`, { data: { email: ACCOUNTS.ana, password: 'errada' } })
    const unknown = await request.post(`${api.url}/api/auth/login`, { data: { email: 'ninguem@timbre.test', password: DEMO_PASSWORD } })
    expect(wrong.status()).toBe(401)
    expect(await wrong.text()).toBe(await unknown.text())
  })

  test('holds the slow account in a loading state for its whole delay', async ({ page }) => {
    await page.goto('/sign-in')
    const button = page.locator(`[data-testid="demo-account-sign-in"][data-email="${ACCOUNTS.slow}"]`)
    await button.click()
    await expect(button).toHaveAttribute('data-loading', 'true')
    await expect(page).toHaveURL(/\/$/, { timeout: 6000 })
    await expect(page.locator('[data-testid="header-account"][data-user-id]')).toContainText('Paulo')
  })

  test('flags an email already in use on sign-up', async ({ page }) => {
    await page.goto('/sign-up')
    await page.getByTestId('field-name').fill('Ana')
    await page.getByTestId('field-email').fill(ACCOUNTS.ana)
    await page.getByTestId('field-password').fill('Outra@1234')
    await page.getByTestId('sign-up-submit').click()
    await expect(page.getByTestId('field-error-email')).toHaveAttribute('data-error-code', 'EMAIL_TAKEN')
  })
})

test.describe('signed in by storageState', () => {
  test.use({ account: 'bruno' })

  test('lists Bruno\'s three orders and signs out', async ({ page }) => {
    await page.goto('/account/orders')
    await expect(page.getByTestId('order-row')).toHaveCount(3)
    await page.locator('[data-testid="header-account"][data-user-id]').click()
    await page.getByTestId('sign-out').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('header-account')).toContainText('Entrar')
  })
})
