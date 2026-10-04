<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { fetchProduct } from '@/api/catalog'
import { ApiError } from '@/api/client'
import ErrorState from '@/components/base/ErrorState.vue'
import PriceDisplay from '@/components/base/PriceDisplay.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import SpecStrip from '@/components/base/SpecStrip.vue'
import StarRating from '@/components/base/StarRating.vue'
import ProductBuyBox from '@/components/product/ProductBuyBox.vue'
import ProductGallery from '@/components/product/ProductGallery.vue'
import ProductInfo from '@/components/product/ProductInfo.vue'
import RelatedProducts from '@/components/product/RelatedProducts.vue'
import SellerPanel from '@/components/product/SellerPanel.vue'
import ShippingEstimator from '@/components/product/ShippingEstimator.vue'
import VariantSelector from '@/components/product/VariantSelector.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { useRequest } from '@/composables/useRequest'
import { useToast } from '@/composables/useToast'
import { currencyFor, localizePath } from '@/lib/language'
import { buyState, clampQuantity, optionQuery, selectOption } from '@/lib/variant'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { useCartStore } from '@/stores/cart'
import { useCatalogStore } from '@/stores/catalog'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const language = usePageLanguage()
const toast = useToast()
const catalog = useCatalogStore()
const cart = useCartStore()
void catalog.loadCategories()

const id = computed(() => String(route.params.id))
const currency = computed(() => currencyFor(language.value))
const request = useRequest(
  () => `${id.value}:${currency.value}`,
  (signal) => fetchProduct(id.value, currency.value, { signal }),
)
const product = computed(() => request.data.value)
const notFound = computed(() => request.error.value?.code === 'NOT_FOUND')

const optionId = computed(() => (product.value ? selectOption(product.value, route.query.option) : null))
const state = computed(() => (product.value ? buyState(product.value, optionId.value) : null))
const categorySlug = computed(() =>
  product.value ? catalog.byId.get(product.value.categoryId)?.slug : undefined,
)

const quantity = ref(1)
watch(optionId, () => (quantity.value = 1))
const adding = ref<'cart' | 'buy' | null>(null)
const addError = ref<{ message: string; code: string } | null>(null)

function choose(next: string): void {
  if (!product.value) return
  const query = { ...route.query }
  delete query.option
  void router.replace({ query: { ...query, ...optionQuery(product.value, next) } })
}

async function add(mode: 'cart' | 'buy'): Promise<void> {
  if (!product.value || !state.value || state.value.blocked) return
  adding.value = mode
  addError.value = null
  try {
    await cart.add({
      productId: product.value.id,
      quantity: clampQuantity(quantity.value, state.value),
      ...(state.value.option ? { variantOptionId: state.value.option.id } : {}),
    })
    const cartPath = localizePath('/cart', language.value)
    if (mode === 'buy') {
      await router.push(cartPath)
      return
    }
    toast.show({
      testid: 'add-to-cart-toast',
      variant: 'success',
      title: t('product.added'),
      description: product.value.name,
      actionLabel: t('product.addedAction'),
      actionTo: cartPath,
    })
  } catch (error) {
    const apiError = error instanceof ApiError ? error : null
    addError.value = {
      code: apiError?.code ?? 'NETWORK_ERROR',
      message:
        apiError?.code === 'INSUFFICIENT_STOCK'
          ? t('product.insufficientStock', { available: apiError.available ?? 0 }, apiError.available ?? 0)
          : t('product.addFailed'),
    }
  } finally {
    adding.value = null
  }
}
</script>

<template>
  <NotFoundPage v-if="notFound" />
  <main
    v-else
    id="main"
    data-testid="product-page"
    :data-product-id="id"
    :data-state="request.status.value"
    class="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-4 py-6 md:px-6"
  >
    <ErrorState
      v-if="request.status.value === 'error'"
      testid="product-error"
      :title="t('product.errorTitle')"
      :description="t('product.errorDescription')"
      :code="request.error.value?.code"
      @retry="request.retry"
    />
    <div v-else-if="!product || !state" data-testid="product-skeleton" data-state="loading" role="status" :aria-label="t('product.loading')" class="grid gap-8 lg:grid-cols-2">
      <SkeletonBlock height="h-[480px]" rounded="card" />
      <div class="flex flex-col gap-3">
        <SkeletonBlock width="w-3/4" height="h-8" />
        <SkeletonBlock width="w-1/3" height="h-10" />
        <SkeletonBlock width="w-1/2" />
        <SkeletonBlock height="h-12" />
      </div>
    </div>
    <template v-else>
      <div class="grid gap-8 lg:grid-cols-2">
        <ProductGallery :images="product.images" :name="product.name" />
        <div class="card flex flex-col gap-5 self-start p-6">
          <div class="flex flex-col gap-2">
            <h1 data-testid="product-title" class="font-wide text-display text-ink">{{ product.name }}</h1>
            <a href="#reviews" data-testid="product-rating-link" class="self-start">
              <StarRating :rating="product.rating" :review-count="product.reviewCount" testid="product-rating" />
            </a>
          </div>
          <PriceDisplay :price="state.unitPrice" :list-price="state.listPrice" testid="product-price" />
          <SpecStrip
            :year="product.year"
            :condition="product.condition"
            :state="product.seller.state"
            :tier="product.seller.tier"
            testid="product-spec-strip"
          />
          <VariantSelector v-if="product.variants" :groups="product.variants" :selected-id="optionId" @select="choose" />
          <ProductBuyBox
            v-model:quantity="quantity"
            :product-id="product.id"
            :state="state"
            :adding="adding"
            :add-error="addError?.message ?? null"
            :add-error-code="addError?.code"
            @add="add('cart')"
            @buy="add('buy')"
          />
          <ShippingEstimator />
          <SellerPanel :seller="product.seller" />
        </div>
      </div>
      <ProductInfo :product="product" />
      <RelatedProducts v-if="categorySlug" :product-id="product.id" :category-slug="categorySlug" />
    </template>
  </main>
</template>
