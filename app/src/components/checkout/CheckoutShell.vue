<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CheckoutStepper from '@/components/checkout/CheckoutStepper.vue'
import OrderSummary from '@/components/checkout/OrderSummary.vue'
import { useCartStore } from '@/stores/cart'

interface Props {
  step: 'shipping' | 'payment' | 'review'
}
defineProps<Props>()
defineSlots<{ default: () => unknown }>()
const { t } = useI18n()
const cart = useCartStore()
</script>

<template>
  <main id="main" :data-testid="`checkout-${step}`" class="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-6 md:px-6">
    <h1 class="font-wide text-display-lg text-ink">{{ t('checkout.title') }}</h1>
    <CheckoutStepper :current="step" />
    <div class="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <div class="card flex flex-col gap-5 p-5"><slot /></div>
      <OrderSummary v-if="cart.cart" :cart="cart.cart" :show-items="step === 'review'" />
    </div>
  </main>
</template>
