<script setup lang="ts">
import { cardSchema, type Card } from '@timbre/contracts'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseInput from '@/components/base/BaseInput.vue'
import ErrorSummary from '@/components/checkout/ErrorSummary.vue'
import { useClock } from '@/composables/clock'
import { useForm } from '@/composables/useForm'
import { cardBrand, cvvLength, expiryInPast, formatCardNumber, formatExpiry } from '@/lib/card'

const { t } = useI18n()
const clock = useClock()
const values = reactive({ number: '', holder: '', expiry: '', cvv: '' })
const form = useForm({
  form: 'card',
  schema: cardSchema,
  values: () => values,
  fields: { number: 'cardNumber', holder: 'cardHolder', expiry: 'cardExpiry', cvv: 'cardCvv' },
})
const brand = computed(() => (values.number.replace(/\D/g, '').length >= 2 ? cardBrand(values.number) : null))
const params = computed(() => ({ cvv: { length: cvvLength(values.number) } }))

function message(field: string): string | undefined {
  const key = form.errorFor(field)
  return key ? t(key, params.value[field as 'cvv'] ?? {}) : undefined
}

/** Luhn and the CVV-by-brand rule run on blur, the expiry also against the injected clock. */
function blurExpiry(): void {
  form.blur('expiry')
  if (!form.errorFor('expiry') && expiryInPast(values.expiry, clock.now())) {
    form.setFieldError('expiry', 'validation.card.expiry.past')
  }
}

/** The card for the order, or null after showing every error. Called by the payment step. */
function collect(): Card | null {
  const card = form.submit()
  if (!card) return null
  if (expiryInPast(card.expiry, clock.now())) {
    form.setServerErrors({ expiry: 'validation.card.expiry.past' })
    return null
  }
  return card
}
defineExpose({ collect })
</script>

<template>
  <div data-testid="card-form" :data-brand="brand ?? undefined" class="flex flex-col gap-4">
    <ErrorSummary v-if="form.submitted.value" :errors="form.summary.value" :params="params" />
    <BaseInput
      :model-value="values.number"
      name="cardNumber"
      inputmode="numeric"
      autocomplete="cc-number"
      :maxlength="23"
      required
      :label="t('checkout.card.number')"
      :hint="brand ? t('checkout.card.brand', { brand: t(`checkout.brands.${brand}`) }) : undefined"
      :error="message('number')"
      @update:model-value="values.number = formatCardNumber($event)"
      @blur="form.blur('number')"
    />
    <BaseInput v-model="values.holder" name="cardHolder" autocomplete="cc-name" required :label="t('checkout.card.holder')" :error="message('holder')" @blur="form.blur('holder')" />
    <div class="grid gap-4 sm:grid-cols-2">
      <BaseInput
        :model-value="values.expiry"
        name="cardExpiry"
        inputmode="numeric"
        autocomplete="cc-exp"
        :maxlength="5"
        :placeholder="t('checkout.card.expiryPlaceholder')"
        required
        :label="t('checkout.card.expiry')"
        :error="message('expiry')"
        @update:model-value="values.expiry = formatExpiry($event)"
        @blur="blurExpiry"
      />
      <BaseInput
        v-model="values.cvv"
        name="cardCvv"
        type="password"
        inputmode="numeric"
        autocomplete="cc-csc"
        :maxlength="4"
        required
        :label="t('checkout.card.cvv')"
        :error="message('cvv')"
        @blur="form.blur('cvv')"
      />
    </div>
  </div>
</template>
