<script setup lang="ts">
import { cepSchema, type ShippingQuoteResponse } from '@timbre/contracts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { quoteShipping } from '@/api/catalog'
import { ApiError } from '@/api/client'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import { useFormat } from '@/composables/useFormat'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { currencyFor } from '@/lib/language'

const { t } = useI18n()
const { formatPrice } = useFormat()
const language = usePageLanguage()

const cep = ref('')
const quote = ref<ShippingQuoteResponse | null>(null)
const fieldError = ref<{ message: string; code: string } | null>(null)
const failure = ref<string | null>(null)
const loading = ref(false)

async function submit(): Promise<void> {
  const parsed = cepSchema.safeParse(cep.value.trim())
  if (!parsed.success) {
    fieldError.value = { message: t('shipping.invalid'), code: 'VALIDATION_ERROR' }
    return
  }
  fieldError.value = null
  failure.value = null
  loading.value = true
  try {
    quote.value = await quoteShipping(parsed.data, currencyFor(language.value))
  } catch (error) {
    quote.value = null
    const code = error instanceof ApiError ? error.code : 'NETWORK_ERROR'
    if (code === 'CEP_NOT_FOUND') fieldError.value = { message: t('shipping.notFound'), code }
    else failure.value = code
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section data-testid="shipping-estimator" class="flex flex-col gap-3" aria-labelledby="shipping-title">
    <h2 id="shipping-title" class="text-label text-muted uppercase">{{ t('shipping.title') }}</h2>
    <form class="flex items-start gap-2" novalidate @submit.prevent="submit">
      <BaseInput
        v-model="cep"
        class="flex-1"
        name="shipping-cep"
        testid="shipping-cep-input"
        inputmode="numeric"
        autocomplete="postal-code"
        :maxlength="9"
        :label="t('shipping.cep')"
        placeholder="00000-000"
        :error="fieldError?.message"
        :error-code="fieldError?.code"
      />
      <BaseButton testid="shipping-quote-submit" type="submit" variant="outline" class="mt-5" :loading="loading">
        {{ t('shipping.submit') }}
      </BaseButton>
    </form>
    <ErrorState
      v-if="failure"
      testid="shipping-quote-error"
      :title="t('shipping.failedTitle')"
      :description="t('shipping.failedDescription')"
      :code="failure"
      :retrying="loading"
      @retry="submit"
    />
    <div v-else-if="quote" data-testid="shipping-options" :data-cep="quote.cep" class="flex flex-col gap-2">
      <p class="text-body-sm text-muted">{{ t('shipping.destination', { city: quote.city, state: quote.state }) }}</p>
      <ul class="flex flex-col gap-1">
        <li
          v-for="option in quote.options"
          :key="option.id"
          data-testid="shipping-option"
          :data-method="option.id"
          :data-price="option.price"
          class="flex items-baseline justify-between gap-4 text-body"
        >
          <span>
            {{ t(`shippingMethod.${option.id}`) }}
            <span class="text-body-sm text-muted">· {{ t('shipping.eta', { days: option.etaDays }, option.etaDays) }}</span>
          </span>
          <span class="font-semibold">{{ option.price === 0 ? t('shipping.free') : formatPrice(option.price) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
