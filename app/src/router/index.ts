import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const kitchenSinkEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_KITCHEN_SINK === '1'
const routes: RouteRecordRaw[] = [
  ...(kitchenSinkEnabled
    ? ([
        {
          path: '/kitchen-sink',
          name: 'kitchen-sink',
          component: () => import('@/pages/KitchenSinkPage.vue'),
        },
        { path: '/', name: 'home', redirect: { name: 'kitchen-sink' } },
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