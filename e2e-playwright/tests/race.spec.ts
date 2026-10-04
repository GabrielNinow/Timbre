import { ADDRESS, expect, test } from '../support/fixtures'

/**
 * Two browser contexts, two Demo accounts, one unit of p-0101 left. Both put it in
 * their cart; both try to buy at once. Exactly one order goes through.
 */
test('two Visitors race for the last unit of p-0101', async ({ newVisitor, request, api }) => {
  const [ana, bruno] = await Promise.all([newVisitor('ana'), newVisitor('bruno')])
  for (const page of [ana, bruno]) {
    const { slug } = (await (await request.get(`${api.url}/api/products/p-0101`)).json()) as { slug: string }
    await page.goto(`/p/${slug}--p-0101`)
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByTestId('add-to-cart-toast')).toBeVisible()
    await page.addInitScript((value) => sessionStorage.setItem('timbre.checkout', value), JSON.stringify({ address: ADDRESS, method: 'pix', shippingDone: true, paymentDone: true }))
    await page.goto('/checkout/review')
    await page.getByTestId('field-terms').check()
  }
  await Promise.all([ana.getByTestId('place-order').click(), bruno.getByTestId('place-order').click()])

  const outcome = async (page: typeof ana) => {
    await expect(page.locator('[data-testid="order-confirmation"], [data-testid="payment-error"]')).toBeVisible()
    return (await page.getByTestId('order-confirmation').count()) > 0 ? 'ordered' : await page.getByTestId('payment-error').getAttribute('data-error-code')
  }
  const results = [await outcome(ana), await outcome(bruno)].sort()
  expect(results).toEqual(['STOCK_CHANGED', 'ordered'])
  const { stock } = (await (await request.get(`${api.url}/api/products/p-0101`)).json()) as { stock: number }
  expect(stock).toBe(0)
})
