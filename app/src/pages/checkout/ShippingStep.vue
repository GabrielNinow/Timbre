<script setup lang="ts">
import type { Address } from '@timbre/contracts'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AddressForm from '@/components/checkout/AddressForm.vue'
import CheckoutShell from '@/components/checkout/CheckoutShell.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { localizePath } from '@/lib/language'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'

const router = useRouter()
const language = usePageLanguage()
const checkout = useCheckoutStore()
const cart = useCartStore()
const saving = ref(false)

async function save(address: Address): Promise<void> {
  saving.value = true
  try {
    // Shipping options and their prices depend on the cart's CEP.
    await cart.setCep(address.cep).catch(() => undefined)
    checkout.saveAddress(address)
    await router.push(localizePath('/checkout/payment', language.value))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <CheckoutShell step="shipping">
    <AddressForm :initial="checkout.draft.address" :saving="saving" @submit="save" />
  </CheckoutShell>
</template>
