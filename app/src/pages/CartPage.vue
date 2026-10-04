<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import CartLine from '@/components/cart/CartLine.vue'
import CartSummary from '@/components/cart/CartSummary.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { groupLinesBySeller } from '@/lib/cart'
import { currencyFor } from '@/lib/language'
import { homePath, sellerPath } from '@/router/paths'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const language = usePageLanguage()
const store = useCartStore()

const groups = computed(() => groupLinesBySeller(store.cart?.lines ?? []))
/** A cart shown in another currency is stale: render loading until it is refetched. */
const settled = computed(() => store.cart !== null && store.cart.currency === currencyFor(language.value))
const state = computed(() => {
  if (store.status === 'error') return 'error'
  if (!settled.value) return 'loading'
  return groups.value.length === 0 ? 'empty' : 'ready'
})
</script>

<template>
  <main id="main" data-testid="cart-page" :data-state="state" class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6">
    <h1 class="font-wide text-display-lg text-ink">{{ t('cart.title') }}</h1>
    <ErrorState
      v-if="state === 'error'"
      testid="cart-error"
      :title="t('cart.errorTitle')"
      :description="t('cart.errorDescription')"
      :code="store.error?.code"
      @retry="store.load(currencyFor(language))"
    />
    <div v-else-if="state === 'loading'" data-testid="cart-skeleton" data-state="loading" role="status" :aria-label="t('cart.loading')" class="grid gap-6 lg:grid-cols-[1fr_380px]">
      <SkeletonBlock height="h-64" rounded="card" />
      <SkeletonBlock height="h-80" rounded="card" />
    </div>
    <EmptyState
      v-else-if="state === 'empty'"
      testid="cart-empty"
      :title="t('cart.emptyTitle')"
      :description="t('cart.emptyDescription')"
    >
      <template #action>
        <BaseButton testid="cart-empty-home" variant="outline" :to="homePath(language)">{{ t('cart.emptyAction') }}</BaseButton>
      </template>
    </EmptyState>
    <div v-else-if="store.cart" class="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div class="flex flex-col gap-4">
        <section
          v-for="group in groups"
          :key="group.seller.id"
          data-testid="cart-seller-group"
          :data-seller-id="group.seller.id"
          :aria-labelledby="`cart-seller-${group.seller.id}`"
          class="card px-5 py-2"
        >
          <h2 :id="`cart-seller-${group.seller.id}`" class="border-b border-line py-3 text-body-sm text-muted">
            <RouterLink :to="sellerPath(group.seller.slug, language)" class="font-semibold text-ink hover:underline">
              {{ t('cart.soldBy', { seller: group.seller.name }) }}
            </RouterLink>
          </h2>
          <ul>
            <CartLine v-for="line in group.lines" :key="line.id" :line="line" />
          </ul>
        </section>
      </div>
      <CartSummary :cart="store.cart" />
    </div>
  </main>
</template>
