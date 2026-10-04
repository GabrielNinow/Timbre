import type { Page } from '@playwright/test'
import { draft, expect, openProduct, test, toUsd } from '../support/fixtures'

const MONEY = ['data-price', 'data-list-price', 'data-discount-percent', 'data-percent', 'data-currency']
const structure = (page: Page) =>
  page.locator('main [data-testid]').evaluateAll((els, money) =>
    els.map((el) => {
      const attrs = [...el.attributes]
        .filter((attr) => attr.name.startsWith('data-'))
        .map((attr) => (money.includes(attr.name) || (attr.name === 'data-value' && (el as HTMLElement).dataset.facet === 'price') ? attr.name : `${attr.name}=${attr.value}`))
        .sort()
      return `${el.tagName}|${attrs.join(',')}`
    }), MONEY)

const READY: Record<string, string> = {
  '/': '[data-testid="seller-spotlight-products-grid"]',
  '/search?condition=new': '[data-testid="results-grid"]',
  '/c/guitars': '[data-testid="results-grid"]',
}

test.describe('bilingual pages (ADR 0001)', () => {
  for (const [path, ready] of Object.entries(READY)) {
    test(`${path} has the same structure in both languages`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator(ready)).toBeVisible()
      await expect(page.locator('[data-state="loading"]')).toHaveCount(0)
      const portuguese = await structure(page)
      await page.goto(path === '/' ? '/en' : `/en${path}`)
      await expect(page.locator(ready)).toBeVisible()
      await expect(page.locator('[data-state="loading"]')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.lang)).toBe('en')
      expect(await structure(page)).toEqual(portuguese)
    })
  }

  test('switching keeps path and query, and converts the price filter', async ({ page }) => {
    await page.goto('/search?price=20000-50000&condition=used')
    await expect(page.getByTestId('results-count')).toBeVisible()
    const count = await page.getByTestId('results-count').getAttribute('data-count')
    await page.locator('[data-testid="language-option"][data-language="en"]').click()
    await expect(page).toHaveURL(/\/en\/search\?price=4000-10000&condition=used$/)
    await expect(page.getByTestId('results-count')).toHaveAttribute('data-count', count!)
  })
})

test.describe('multi-currency (ADR 0002)', () => {
  test('prices every card in dollars at the Demo exchange rate', async ({ page }) => {
    const prices = async () =>
      page.locator('[data-testid="product-card"]').evaluateAll((cards) =>
        Object.fromEntries(cards.map((card) => [(card as HTMLElement).dataset.productId, Number((card.querySelector('[data-testid="product-card-price"]') as HTMLElement).dataset.price)])),
      )
    await page.goto('/search?sort=price-asc')
    await expect(page.getByTestId('results-grid')).toBeVisible()
    const brl = await prices()
    await page.goto('/en/search?sort=price-asc')
    await expect(page.getByTestId('results-grid')).toBeVisible()
    const usd = await prices()
    expect(Object.keys(usd)).toEqual(Object.keys(brl))
    for (const id of Object.keys(brl)) expect(usd[id], id).toBe(toUsd(brl[id]!))
  })

  test('prices a variant in dollars', async ({ page, request, api }) => {
    await openProduct(page, request, api.url, 'p-0103', '/en', '?option=v-0103-sonic-blue')
    await expect(page.getByTestId('product-price')).toHaveAttribute('data-price', String(toUsd(344900)))
  })

  test('the same cart adds up in both currencies with the same shipping outcome', async ({ page, seed }) => {
    // R$ 299,40: the nearest reachable cart below the R$ 300,00 threshold.
    await seed.cart([{ productId: 'p-0602', quantity: 6 }])
    for (const [prefix, shipping] of [['', 2490], ['/en', 498]] as const) {
      await page.goto(`${prefix}/cart`)
      await expect(page.getByTestId('cart-page')).toHaveAttribute('data-state', 'ready')
      await expect(page.getByTestId('summary-shipping')).toHaveAttribute('data-price', String(shipping))
      const lines = await page.getByTestId('cart-line-total').evaluateAll((els) => els.reduce((sum, el) => sum + Number((el as HTMLElement).dataset.price), 0))
      const subtotal = Number(await page.getByTestId('summary-subtotal').getAttribute('data-price'))
      expect(subtotal).toBe(lines)
      expect(Number(await page.getByTestId('summary-total').getAttribute('data-price'))).toBe(subtotal + shipping)
    }
  })

  test.describe('signed in', () => {
    test.use({ account: 'ana' })

    test('card only under /en; a Pix draft bounces back to payment', async ({ page, seed }) => {
      await seed.cart([{ productId: 'p-0104' }])
      await seed.checkout(draft('pix'))
      await page.goto('/en/checkout/review')
      await expect(page).toHaveURL(/\/en\/checkout\/payment\?reason=PAYMENT_METHOD_UNAVAILABLE$/)
      await expect(page.getByTestId('payment-error')).toHaveAttribute('data-error-code', 'PAYMENT_METHOD_UNAVAILABLE')
      await expect(page.getByTestId('payment-method-tab')).toHaveCount(1)
      await expect(page.getByTestId('cart-count')).toHaveAttribute('data-count', '1')
    })
  })
})
