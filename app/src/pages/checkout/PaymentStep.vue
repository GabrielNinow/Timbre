<script setup lang="ts">
import type { PaymentMethod } from '@timbre/contracts'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'
import CardForm from '@/components/checkout/CardForm.vue'
import CheckoutShell from '@/components/checkout/CheckoutShell.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { currencyFor, localizePath } from '@/lib/language'
import { useCheckoutStore } from '@/stores/checkout'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const language = usePageLanguage()
const checkout = useCheckoutStore()

/** Pix and boleto move reais only (ADR 0002): in dollars, card is the only method. */
const methods = computed<PaymentMethod[]>(() =>
  currencyFor(language.value) === 'USD' ? ['card'] : ['card', 'pix', 'boleto'],
)
const method = ref<PaymentMethod>(
  checkout.draft.method && methods.value.includes(checkout.draft.method) ? checkout.draft.method : 'card',
)
const reason = computed(() => (typeof route.query.reason === 'string' ? route.query.reason : null))
const cardForm = ref<InstanceType<typeof CardForm> | null>(null)

async function next(): Promise<void> {
  if (method.value === 'card') {
    const card = cardForm.value?.collect()
    if (!card) return
    checkout.savePayment('card', card)
  } else checkout.savePayment(method.value, null)
  await router.push(localizePath('/checkout/review', language.value))
}
</script>

<template>
  <CheckoutShell step="payment">
    <p
      v-if="reason"
      data-testid="payment-error"
      :data-error-code="reason"
      role="alert"
      class="rounded-card border border-fault bg-fault-quiet p-3 text-body text-fault"
    >
      {{ reason === 'CARD_REENTRY' ? t('checkout.cardReentry') : t(`checkout.paymentErrors.${reason}`) }}
    </p>
    <p v-if="methods.length === 1" data-testid="card-only-notice" class="text-body-sm text-ink">{{ t('checkout.cardOnlyNotice') }}</p>
    <TabsRoot v-model="method" data-testid="payment-methods" :data-method="method" class="flex flex-col gap-4">
      <TabsList :aria-label="t('checkout.methodsLabel')" class="flex flex-wrap gap-2">
        <TabsTrigger
          v-for="option in methods"
          :key="option"
          :value="option"
          data-testid="payment-method-tab"
          :data-method="option"
          class="btn h-10 border-line-heavy bg-surface px-4 text-body text-ink data-[state=active]:border-band data-[state=active]:bg-action-quiet data-[state=active]:font-semibold"
        >
          {{ t(`checkout.methods.${option}`) }}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="card"><CardForm ref="cardForm" /></TabsContent>
      <TabsContent value="pix"><p class="text-body text-ink">{{ t('checkout.pixNote') }}</p></TabsContent>
      <TabsContent value="boleto"><p class="text-body text-ink">{{ t('checkout.boletoNote') }}</p></TabsContent>
    </TabsRoot>
    <BaseButton testid="payment-submit" size="lg" @click="next">{{ t('checkout.continueToReview') }}</BaseButton>
  </CheckoutShell>
</template>
