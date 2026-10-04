<script setup lang="ts">
import { cepSchema } from '@timbre/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/client'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BasePopover from '@/components/base/BasePopover.vue'
import { formatCep } from '@/lib/format'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const cart = useCartStore()
const open = ref(false)
const draft = ref('')
const error = ref<{ code: string; message: string } | null>(null)
const current = computed(() => (cart.cart ? formatCep(cart.cart.cep) : null))

function onOpen(value: boolean): void {
  open.value = value
  if (value) {
    draft.value = current.value ?? ''
    error.value = null
  }
}

async function save(): Promise<void> {
  const parsed = cepSchema.safeParse(draft.value.trim())
  if (!parsed.success) {
    error.value = { code: 'VALIDATION_ERROR', message: t('cepSelector.invalid') }
    return
  }
  try {
    await cart.setCep(parsed.data)
    open.value = false
  } catch (caught) {
    const code = caught instanceof ApiError ? caught.code : 'NETWORK_ERROR'
    error.value = { code, message: code === 'CEP_NOT_FOUND' ? t('cepSelector.notFound') : t('cepSelector.failed') }
  }
}
</script>

<template>
  <BasePopover
    :open="open"
    testid="cep-selector"
    content-testid="cep-selector-content"
    align="end"
    :title="t('cepSelector.title')"
    :description="t('cepSelector.description')"
    @update:open="onOpen"
  >
    <template #trigger>
      <button
        type="button"
        :data-cep="cart.cart?.cep"
        class="btn h-8 px-2 text-body-sm text-on-band hover:bg-band-hover focus-visible:outline-on-band"
      >
        {{ current ? t('cepSelector.trigger', { cep: current }) : t('cepSelector.title') }}
      </button>
    </template>
    <form class="flex flex-col gap-2" novalidate @submit.prevent="save">
      <BaseInput
        v-model="draft"
        name="header-cep"
        testid="cep-selector-input"
        inputmode="numeric"
        autocomplete="postal-code"
        :maxlength="9"
        :label="t('cepSelector.label')"
        :error="error?.message"
        :error-code="error?.code"
      />
      <BaseButton testid="cep-selector-submit" type="submit" size="sm" :loading="cart.pending?.kind === 'cep'">
        {{ t('cepSelector.submit') }}
      </BaseButton>
    </form>
  </BasePopover>
</template>
