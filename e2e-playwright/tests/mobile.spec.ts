import { expect, test } from '../support/fixtures'

/** Runs only in the `mobile` project (a Pixel 7 device descriptor): the rail becomes a dialog. */
test('the filter rail is a keyboard-operable full-screen dialog on a phone @mobile', async ({ page }) => {
  await page.goto('/search')
  await expect(page.getByTestId('results-grid')).toBeVisible()
  await expect(page.locator('aside [data-testid="filter-rail"]')).toHaveCount(0)
  const open = page.getByTestId('filter-open')
  await open.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByTestId('filter-dialog')
  await expect(dialog.getByTestId('filter-rail')).toBeVisible()
  for (let i = 0; i < 30; i += 1) await page.keyboard.press('Tab')
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  await dialog.locator('[data-facet="condition"][data-value="new"] input').focus()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/condition=new/)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
