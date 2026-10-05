<script setup lang="ts">
import { assetUrl } from '@/lib/assets'
import type { CartLine } from '@timbre/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/client'
import BaseButton from '@/components/base/BaseButton.vue'
import QuantityStepper from '@/components/base/QuantityStepper.vue'
import { useFormat } from '@/composables/useFormat'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { productPath } from '@/router/paths'
import { useCartStore } from '@/stores/cart'

interface Props {
  line: CartLine
}
const props = defineProps<Props>()
const { t } = useI18n()
const { formatPrice } = useFormat()
const language = usePageLanguage()
const cart = useCartStore()

const error = ref<{ code: string; message: string } | null>(null)
const busy = computed(() => {
  const action = cart.pending
  return action !== null && 'lineId' in action && action.lineId === props.line.id ? action.kind : null
})

async function guard(call: () => Promise<unknown>): Promise<void> {
  error.value = null
  try {
    await call()
  } catch (caught) {
    const apiError = caught instanceof ApiError ? caught : null
    error.value = {
      code: apiError?.code ?? 'NETWORK_ERROR',
      message:
        apiError?.code === 'INSUFFICIENT_STOCK'
          ? t('cart.lineError', { available: apiError.available ?? 0 }, apiError.available ?? 0)
          : t('cart.lineFailed'),
    }
  }
}
</script>

<template>
  <li
    data-testid="cart-line"
    :data-line-id="line.id"
    :data-product-id="line.product.id"
    :data-option-id="line.variant?.optionId"
    class="flex gap-4 border-b border-line py-4 last:border-b-0"
  >
    <img :src="assetUrl(line.product.imageUrl)" alt="" width="96" height="96" class="size-24 shrink-0 rounded-control border border-line bg-surface object-contain p-1">
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="flex min-w-0 flex-col gap-1">
          <RouterLink :to="productPath(line.product, language)" data-testid="cart-line-title" class="text-body font-semibold text-ink hover:underline">
            {{ line.product.name }}
          </RouterLink>
          <p v-if="line.variant" data-testid="cart-line-variant" class="text-body-sm text-muted">
            {{ line.variant.groupLabel }}: {{ line.variant.optionName }}
          </p>
          <p data-testid="cart-line-unit-price" :data-price="line.unitPrice" class="text-body-sm text-muted">
            {{ t('cart.unitPrice', { price: formatPrice(line.unitPrice) }) }}
          </p>
        </div>
        <p class="text-right">
          <span class="sr-only">{{ t('cart.lineTotal') }}: </span>
          <span data-testid="cart-line-total" :data-price="line.lineTotal" class="text-heading text-ink">{{ formatPrice(line.lineTotal) }}</span>
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <QuantityStepper
          testid="cart-line-qty"
          :notice-testid="`cart-line-qty-limit`"
          :label="t('cart.quantityLabel', { name: line.product.name })"
          :model-value="line.quantity"
          :max="Math.max(line.availableStock, 1)"
          :disabled="busy !== null"
          @update:model-value="guard(() => cart.setQuantity(line.id, $event))"
        />
        <BaseButton
          testid="cart-line-remove"
          variant="quiet"
          size="sm"
          :loading="busy === 'remove'"
          :disabled="busy !== null"
          :aria-label="t('cart.removeLabel', { name: line.product.name })"
          @click="guard(() => cart.remove(line.id))"
        >
          {{ t('cart.remove') }}
        </BaseButton>
      </div>
      <p v-if="error" data-testid="cart-line-error" :data-error-code="error.code" role="alert" class="text-body-sm text-fault">
        {{ error.message }}
      </p>
    </div>
  </li>
</template>
