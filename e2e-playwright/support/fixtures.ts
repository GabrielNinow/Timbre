import { test as base, expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { startApi } from './api-server'

export { expect }

export const DEMO_PASSWORD = 'Teste@1234'
export const ACCOUNTS = {
  ana: 'ana.souza@timbre.test',
  bruno: 'bruno.lima@timbre.test',
  locked: 'bloqueado@timbre.test',
  slow: 'lento@timbre.test',
} as const
export type Account = keyof typeof ACCOUNTS

export const ADDRESS = {
  recipient: 'Ana Souza',
  cep: '89010000',
  street: 'Rua XV de Novembro',
  number: '1400',
  complement: '',
  district: 'Centro',
  city: 'Blumenau',
  state: 'SC',
}

export interface CheckoutDraft {
  address: typeof ADDRESS | null
  method: 'card' | 'pix' | 'boleto' | null
  shippingDone: boolean
  paymentDone: boolean
}
export const draft = (method: CheckoutDraft['method'], paymentDone = method !== null): CheckoutDraft => ({
  address: ADDRESS,
  method,
  shippingDone: true,
  paymentDone,
})

/**
 * Every page's `/api/*` goes to its worker's own API process. The app build and the
 * preview server are shared; the store never is. Routes a test adds later (stubs)
 * take precedence over this one.
 */
export async function routeToApi(context: BrowserContext, apiUrl: string): Promise<void> {
  await context.route('**/api/**', async (route) => {
    const original = new URL(route.request().url())
    try {
      const response = await route.fetch({ url: `${apiUrl}${original.pathname}${original.search}` })
      await route.fulfill({ response })
    } catch {
      // The test ended while this request was in flight: its page is gone, nothing to answer.
      await route.abort().catch(() => undefined)
    }
  })
}

async function sessionToken(request: APIRequestContext, apiUrl: string, email: string): Promise<string> {
  const response = await request.post(`${apiUrl}/api/test/session`, { data: { email } })
  return ((await response.json()) as { token: string }).token
}

function storageFor(baseURL: string, token: string) {
  return { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: 'timbre.session', value: token }] }] }
}

export interface Seeder {
  /** Cart lines over the API: on the signed-in account, or a guest cart remembered for the page. */
  cart(items: Array<{ productId: string; quantity?: number; variantOptionId?: string }>): Promise<string>
  /** `sessionStorage['timbre.checkout']`, so a test can start at payment or review. */
  checkout(value: CheckoutDraft): Promise<void>
  /** Both clocks: the API's for due dates, the browser's for countdowns. */
  clock(iso: string): Promise<void>
  /** `POST /api/test/failure`: the next call(s) to `route` fail for real. */
  failure(route: string, options?: { times?: number; status?: number; code?: string }): Promise<void>
}

type WorkerFixtures = { api: { url: string } }
type TestFixtures = {
  /** Sign in by `storageState`, built from an API-seeded session. */
  account: Account | null
  token: string | null
  resetStore: void
  seed: Seeder
  /** A second, isolated Visitor in its own browser context. */
  newVisitor: (account?: Account) => Promise<Page>
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  api: [
    async ({}, use, workerInfo) => {
      const server = await startApi(3400 + workerInfo.parallelIndex)
      await use({ url: server.url })
      await server.stop()
    },
    { scope: 'worker' },
  ],

  resetStore: [
    async ({ api, request }, use) => {
      await request.post(`${api.url}/api/test/reset`)
      await use()
    },
    { auto: true },
  ],

  account: [null, { option: true }],

  token: async ({ account, api, request, resetStore }, use) => {
    void resetStore
    await use(account ? await sessionToken(request, api.url, ACCOUNTS[account]) : null)
  },

  storageState: async ({ token, baseURL }, use) => {
    await use(token ? storageFor(baseURL!, token) : { cookies: [], origins: [] })
  },

  context: async ({ context, api }, use) => {
    await routeToApi(context, api.url)
    await use(context)
  },

  seed: async ({ api, request, token, page }, use) => {
    const auth = token ? { authorization: `Bearer ${token}` } : undefined
    await use({
      async cart(items) {
        const cart = (await (await request.get(`${api.url}/api/cart`, { headers: auth })).json()) as { id: string }
        const headers = auth ?? { 'x-cart-id': cart.id }
        for (const item of items) {
          await request.post(`${api.url}/api/cart/items`, { headers, data: { quantity: 1, ...item } })
        }
        if (!token) await page.addInitScript((id) => localStorage.setItem('timbre.cart', id), cart.id)
        return cart.id
      },
      async checkout(value) {
        await page.addInitScript((json) => sessionStorage.setItem('timbre.checkout', json), JSON.stringify(value))
      },
      async clock(iso) {
        await request.post(`${api.url}/api/test/clock`, { data: { now: iso } })
        await page.clock.setFixedTime(new Date(iso))
      },
      async failure(route, options = {}) {
        await request.post(`${api.url}/api/test/failure`, {
          data: { route, times: options.times ?? 1, status: options.status ?? 500, ...(options.code ? { code: options.code } : {}) },
        })
      },
    })
  },

  newVisitor: async ({ browser, api, request, baseURL }, use) => {
    const contexts: BrowserContext[] = []
    await use(async (account) => {
      const token = account ? await sessionToken(request, api.url, ACCOUNTS[account]) : null
      const context = await (browser as Browser).newContext({ baseURL, ...(token ? { storageState: storageFor(baseURL!, token) } : {}) })
      await routeToApi(context, api.url)
      contexts.push(context)
      return context.newPage()
    })
    for (const context of contexts) await context.close()
  },
})

/** Opens `/p/:slug--:id`, reading the slug from the API rather than hardcoding it. */
export async function openProduct(page: Page, request: APIRequestContext, apiUrl: string, id: string, prefix = '', query = '') {
  const { slug } = (await (await request.get(`${apiUrl}/api/products/${id}`)).json()) as { slug: string }
  await page.goto(`${prefix}/p/${slug}--${id}${query}`)
  await expect(page.getByTestId('product-page')).toHaveAttribute('data-state', 'ready')
}

export const toUsd = (brl: number): number => Math.floor((brl * 2 + 5) / 10)
