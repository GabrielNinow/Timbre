import AxeBuilder from '@axe-core/playwright'
import { draft, expect, test, type Account } from '../support/fixtures'

/** @axe-core/playwright on every route, both languages: zero wcag2a/wcag2aa violations. */
const ROUTES: Array<{ path: string; account?: Account; cart?: boolean; checkout?: ReturnType<typeof draft> }> = [
  { path: '/' },
  { path: '/search' },
  { path: '/search?q=zzzz' },
  { path: '/c/guitars' },
  { path: '/p/squier-classic-vibe-telecaster--p-0103' },
  { path: '/p/gibson-les-paul-studio-2018--p-0102' },
  { path: '/s/vintage-room' },
  { path: '/cart' },
  { path: '/cart', cart: true },
  { path: '/sign-in' },
  { path: '/sign-up' },
  { path: '/checkout/shipping', account: 'ana', cart: true },
  { path: '/checkout/payment', account: 'ana', cart: true, checkout: draft('card', false) },
  { path: '/checkout/review', account: 'ana', cart: true, checkout: draft('pix') },
  { path: '/account/orders', account: 'bruno' },
  { path: '/orders/TMB-100236', account: 'bruno' },
  { path: '/nowhere' },
]

for (const prefix of ['', '/en']) {
  for (const route of ROUTES) {
    const path = route.path === '/' && prefix ? prefix : `${prefix}${route.path}`
    test.describe(`a11y ${path}${route.cart ? ' (with cart)' : ''}`, () => {
      test.use({ account: route.account ?? null })
      test('has no wcag2a/wcag2aa violations', async ({ page, seed }) => {
        if (route.cart) await seed.cart([{ productId: 'p-0104' }])
        if (route.checkout) await seed.checkout(route.checkout)
        await page.goto(path)
        await expect(page.locator('main')).toBeVisible()
        await expect(page.locator('[data-state="loading"]')).toHaveCount(0)
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
      })
    })
  }
}
