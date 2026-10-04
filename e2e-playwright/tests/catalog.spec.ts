import { expect, test } from '../support/fixtures'

const cards = '[data-testid="results-grid"] [data-testid="product-card"]'

test.describe('catalog', () => {
  test('reconstructs a filtered, sorted, paginated listing from its URL alone', async ({ page }) => {
    await page.goto('/search?condition=new&condition=like-new&sort=price-asc&page=2')
    await expect(page.getByTestId('results-grid')).toBeVisible()
    const first = await page.locator(cards).evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.productId))
    await page.reload()
    await expect(page.getByTestId('results-grid')).toBeVisible()
    expect(await page.locator(cards).evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.productId))).toEqual(first)
    await expect(page.getByTestId('filter-chip')).toHaveCount(2)
    await expect(page.getByTestId('sort-select')).toHaveAttribute('data-value', 'price-asc')
  })

  test('writes filter changes to the URL, chips and facet counts', async ({ page }) => {
    await page.goto('/search')
    const used = page.locator('[data-testid="filter-option"][data-facet="condition"][data-value="used"]')
    await expect(page.getByTestId('results-grid')).toBeVisible()
    const usedBefore = await used.getAttribute('data-count')
    await page.locator('[data-testid="filter-option"][data-facet="condition"][data-value="new"] input').check()
    await expect(page).toHaveURL(/\?condition=new$/)
    await expect(page.locator('[data-testid="filter-chip"][data-facet="condition"][data-value="new"]')).toBeVisible()
    await expect(used).toHaveAttribute('data-count', usedBefore!)
    await expect(page.getByTestId('results-count')).toHaveAttribute('data-count', '24')
    await page.goBack()
    await expect(page.getByTestId('filter-chip')).toHaveCount(0)
  })

  test('removes one chip or all, returning to page 1', async ({ page }) => {
    await page.goto('/search?brand=Fender&freeShipping=true&price=20000-50000&page=2')
    await page.locator('[data-testid="filter-chip"][data-facet="brand"]').click()
    await expect(page).toHaveURL(/\?price=20000-50000&freeShipping=true$/)
    await page.getByTestId('filter-clear-all').click()
    await expect(page).toHaveURL(/\/search$/)
  })

  test('validates a typed price range without a request', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByTestId('results-grid')).toBeVisible()
    let requests = 0
    page.on('request', (request) => {
      if (request.url().includes('/api/products')) requests += 1
    })
    await page.getByTestId('filter-price-min').fill('500')
    await page.getByTestId('filter-price-max').fill('200')
    await page.getByTestId('filter-price-apply').click()
    await expect(page.getByTestId('field-error-price-max')).toHaveAttribute('data-error-code', 'min-above-max')
    expect(requests).toBe(0)
    await page.getByTestId('filter-price-min').fill('200')
    await page.getByTestId('filter-price-max').fill('500')
    await page.getByTestId('filter-price-apply').click()
    await expect(page).toHaveURL(/\?price=20000-50000$/)
  })

  test('searches from the header and pins a category page', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('search-input').fill('fender')
    await page.getByTestId('search-submit').click()
    await expect(page).toHaveURL(/\/search\?q=fender$/)
    await page.goto('/c/guitars')
    await expect(page.locator(cards)).toHaveCount(14)
    await expect(page.locator('[data-testid="filter-group"][data-facet="category"]')).toHaveCount(0)
    await page.goto('/c/trumpets')
    await expect(page.getByTestId('not-found')).toBeVisible()
  })

  test('keeps sponsored listings in their labelled row', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="home-sponsored"] [data-badge="sponsored"]')).toHaveCount(6)
    await page.goto('/search')
    await expect(page.getByTestId('results-grid')).toBeVisible()
    await expect(page.locator('[data-badge="sponsored"]')).toHaveCount(0)
  })
})

test.describe('the three error-injection layers', () => {
  test('server-side arming, then a retry', async ({ page, seed }) => {
    await seed.failure('GET /api/products')
    await page.goto('/search?q=fender')
    await expect(page.getByTestId('results-error')).toHaveAttribute('data-error-code', 'INJECTED_FAILURE')
    await page.getByTestId('results-error-retry').click()
    await expect(page.getByTestId('results-grid')).toHaveAttribute('data-state', 'ready')
  })

  test('page.route: malformed JSON', async ({ page }) => {
    await page.route('**/api/products*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{ not json' }))
    await page.goto('/search')
    await expect(page.getByTestId('results-error')).toHaveAttribute('data-error-code', 'MALFORMED_RESPONSE')
  })

  test('page.route: a hung request keeps the skeleton', async ({ page }) => {
    await page.route('**/api/products*', () => new Promise(() => undefined))
    await page.goto('/search')
    await expect(page.getByTestId('results-skeleton')).toHaveAttribute('data-state', 'loading')
    await expect(page.getByTestId('product-card-skeleton')).toHaveCount(10)
    await expect(page.getByTestId('results-grid')).toHaveCount(0)
  })

  test('page.route: an empty result set for a query that would match', async ({ page, api }) => {
    await page.route('**/api/products*', async (route) => {
      const url = new URL(route.request().url())
      const response = await route.fetch({ url: `${api.url}${url.pathname}${url.search}` })
      const body = await response.json()
      await route.fulfill({ response, json: { ...body, items: [], total: 0 } })
    })
    await page.goto('/search?q=fender&brand=Fender')
    await expect(page.getByTestId('results-empty')).toHaveAttribute('data-state', 'empty')
  })
})
