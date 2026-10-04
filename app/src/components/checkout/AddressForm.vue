<script setup lang="ts">
import { addressSchema, cepSchema, ufSchema, type Address } from '@timbre/contracts'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { quoteShipping } from '@/api/catalog'
import { ApiError } from '@/api/client'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import ErrorSummary from '@/components/checkout/ErrorSummary.vue'
import { useForm } from '@/composables/useForm'

interface Props {
  initial: Address | null
  saving: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{ submit: [address: Address] }>()
const { t } = useI18n()

const values = reactive({
  recipient: props.initial?.recipient ?? '',
  cep: props.initial?.cep ?? '',
  street: props.initial?.street ?? '',
  number: props.initial?.number ?? '',
  complement: props.initial?.complement ?? '',
  district: props.initial?.district ?? '',
  city: props.initial?.city ?? '',
  state: (props.initial?.state ?? '') as string,
})
const FIELDS = ['recipient', 'cep', 'street', 'number', 'complement', 'district', 'city', 'state'] as const
const form = useForm({
  form: 'address',
  schema: addressSchema,
  values: () => values,
  fields: Object.fromEntries(FIELDS.map((field) => [field, field])),
})
const cepCode = ref<string | null>(null)
const lookupFailed = ref(false)
const looking = ref(false)
const states = ufSchema.options.map((uf) => ({ value: uf, label: uf }))

/** CEP on blur: fills city and state (the fixtures carry no street), both stay editable. */
async function lookup(): Promise<void> {
  form.blur('cep')
  cepCode.value = null
  lookupFailed.value = false
  const parsed = cepSchema.safeParse(values.cep.trim())
  if (!parsed.success) return
  looking.value = true
  try {
    const quote = await quoteShipping(parsed.data, 'BRL')
    values.city = quote.city
    values.state = quote.state
  } catch (caught) {
    const code = caught instanceof ApiError ? caught.code : 'NETWORK_ERROR'
    if (code === 'CEP_NOT_FOUND') {
      cepCode.value = code
      form.setFieldError('cep', 'shipping.notFound')
    } else lookupFailed.value = true
  } finally {
    looking.value = false
  }
}

function submit(): void {
  if (cepCode.value) {
    form.setServerErrors({ cep: 'shipping.notFound' })
    return
  }
  const address = form.submit()
  if (address) emit('submit', address)
}
const message = (field: string) => (form.errorFor(field) ? t(form.errorFor(field)!) : undefined)
</script>

<template>
  <form data-testid="address-form" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <ErrorSummary v-if="form.submitted.value" :errors="form.summary.value" />
    <ErrorState
      v-if="lookupFailed"
      testid="cep-lookup-error"
      :title="t('checkout.cepLookupFailed')"
      :retry-label="t('checkout.cepLookupRetry')"
      :retrying="looking"
      @retry="lookup"
    />
    <BaseInput v-model="values.recipient" name="recipient" autocomplete="name" required :label="t('checkout.address.recipient')" :error="message('recipient')" @blur="form.blur('recipient')" />
    <div class="grid gap-4 sm:grid-cols-[200px_1fr]">
      <BaseInput
        v-model="values.cep"
        name="cep"
        inputmode="numeric"
        autocomplete="postal-code"
        :maxlength="9"
        required
        :label="t('checkout.address.cep')"
        placeholder="00000-000"
        :error="message('cep')"
        :error-code="cepCode ?? undefined"
        @blur="lookup"
      />
      <BaseInput v-model="values.street" name="street" autocomplete="address-line1" required :label="t('checkout.address.street')" :error="message('street')" @blur="form.blur('street')" />
    </div>
    <div class="grid gap-4 sm:grid-cols-[140px_1fr]">
      <BaseInput v-model="values.number" name="number" required :label="t('checkout.address.number')" :error="message('number')" @blur="form.blur('number')" />
      <BaseInput v-model="values.complement" name="complement" autocomplete="address-line2" :label="t('checkout.address.complement')" :error="message('complement')" @blur="form.blur('complement')" />
    </div>
    <BaseInput v-model="values.district" name="district" required :label="t('checkout.address.district')" :error="message('district')" @blur="form.blur('district')" />
    <div class="grid gap-4 sm:grid-cols-[1fr_160px]">
      <BaseInput v-model="values.city" name="city" autocomplete="address-level2" required :label="t('checkout.address.city')" :error="message('city')" @blur="form.blur('city')" />
      <BaseSelect
        v-model="values.state"
        name="state"
        required
        :label="t('checkout.address.state')"
        :placeholder="t('checkout.address.statePlaceholder')"
        :options="states"
        :error="message('state')"
        @update:model-value="form.blur('state')"
      />
    </div>
    <BaseButton testid="shipping-submit" type="submit" size="lg" :loading="saving">{{ t('checkout.continueToPayment') }}</BaseButton>
  </form>
</template>
