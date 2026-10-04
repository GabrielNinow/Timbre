import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { applyPageLanguage } from '@/i18n'
import { languageOfPath } from '@/lib/language'

export const kitchenSinkEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_KITCHEN_SINK === '1'

/** Every route accepts the optional `/en` prefix (ADR 0001). Anything else falls through to not-found. */
const LANG = '/:locale(en)?'

const routes: RouteRecordRaw[] = [
  { path: LANG, name: 'home', component: () => import('@/pages/HomePage.vue') },
  { path: `${LANG}/search`, name: 'search', component: () => import('@/pages/ListingPage.vue') },
  {
    path: `${LANG}/c/:categorySlug`,
    name: 'category',
    component: () => import('@/pages/ListingPage.vue'),
  },
  {
    // `/p/:slug--:id`: the double dash separates slug from id, the id is authoritative.
    path: `${LANG}/p/:slug([a-z0-9-]+?)--:id(p-[0-9]+)`,
    name: 'product',
    component: () => import('@/pages/ProductPage.vue'),
  },
  {
    path: `${LANG}/s/:sellerSlug([a-z0-9-]+)`,
    name: 'seller',
    component: () => import('@/pages/SellerPage.vue'),
  },
  { path: `${LANG}/cart`, name: 'cart', component: () => import('@/pages/CartPage.vue') },
  ...(kitchenSinkEnabled
    ? ([
        {
          path: `${LANG}/kitchen-sink`,
          name: 'kitchen-sink',
          component: () => import('@/pages/KitchenSinkPage.vue'),
        },
      ] satisfies RouteRecordRaw[])
    : []),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
  },
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeResolve((to) => {
  applyPageLanguage(languageOfPath(to.path))
})
