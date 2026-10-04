import { expect, test } from '../support/fixtures'

/**
 * Deliberately failing, to show trace-viewer debugging. Excluded from every normal
 * run; `npm run pw:trace-demo -w @timbre/e2e-playwright` runs it with `trace: 'on'`,
 * then `npx playwright show-trace` on the zip in test-results shows each step, the
 * DOM, and the network call that returned the injected failure.
 */
test('a listing that never loads @trace-demo', async ({ page, seed }) => {
  await seed.failure('GET /api/products', { times: 3 })
  await page.goto('/search')
  // Wrong on purpose: the armed failure renders results-error, not results-grid.
  await expect(page.getByTestId('results-grid')).toBeVisible({ timeout: 3000 })
})
