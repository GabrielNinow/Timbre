<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import QuantityStepper from '@/components/base/QuantityStepper.vue'
import NotifyMeForm from '@/components/product/NotifyMeForm.vue'
import type { BuyState } from '@/lib/variant'

interface Props {
  productId: string
  state: BuyState
  quantity: number
  adding: 'cart' | 'buy' | null
  addError: string | null
  addErrorCode?: string
}
withDefaults(defineProps<Props>(), { addErrorCode: undefined })
defineEmits<{ 'update:quantity': [value: number]; add: []; buy: [] }>()

const { t } = useI18n()
</script>

<template>
  <div
    data-testid="buy-box"
    :data-blocked="state.blocked ?? undefined"
    class="flex flex-col gap-4"
  >
    <p
      data-testid="stock-notice"
      :data-stock="state.stock"
      :data-stock-state="state.blocked ? 'sold-out' : state.lowStock ? 'low' : 'in-stock'"
      class="text-body"
      :class="state.lowStock ? 'font-semibold text-fault' : state.blocked ? 'text-ink' : 'text-gain'"
    >
      <template v-if="state.blocked === 'sold-out-option'">{{ t('product.stock.optionSoldOut') }}</template>
      <template v-else-if="state.blocked === 'out-of-stock'">{{ t('product.stock.soldOut') }}</template>
      <template v-else-if="state.lowStock">{{ t('product.stock.low', { count: state.stock }, state.stock) }}</template>
      <template v-else>{{ t('product.stock.inStock') }}</template>
    </p>

    <template v-if="state.blocked !== 'out-of-stock'">
      <QuantityStepper
        testid="qty"
        notice-testid="stock-limit-notice"
        :model-value="quantity"
        :max="state.maxQuantity"
        :disabled="state.blocked !== null"
        :hide-label="false"
        @update:model-value="$emit('update:quantity', $event)"
      />
      <div class="flex flex-col gap-2 sm:flex-row">
        <BaseButton
          testid="buy-now"
          size="lg"
          :disabled="state.blocked !== null || adding !== null"
          :loading="adding === 'buy'"
          @click="$emit('buy')"
        >
          {{ state.blocked ? t('product.unavailable') : t('product.buyNow') }}
        </BaseButton>
        <BaseButton
          testid="add-to-cart"
          variant="outline"
          size="lg"
          :disabled="state.blocked !== null || adding !== null"
          :loading="adding === 'cart'"
          @click="$emit('add')"
        >
          {{ t('product.addToCart') }}
        </BaseButton>
      </div>
      <p
        v-if="addError"
        data-testid="add-to-cart-error"
        :data-error-code="addErrorCode"
        role="alert"
        class="text-body-sm text-fault"
      >
        {{ addError }}
      </p>
    </template>

    <template v-else>
      <div class="flex flex-col gap-2 sm:flex-row">
        <BaseButton testid="buy-now" size="lg" disabled>{{ t('product.unavailable') }}</BaseButton>
        <BaseButton testid="add-to-cart" variant="outline" size="lg" disabled>{{ t('product.addToCart') }}</BaseButton>
      </div>
      <NotifyMeForm :product-id="productId" />
    </template>
  </div>
</template>
