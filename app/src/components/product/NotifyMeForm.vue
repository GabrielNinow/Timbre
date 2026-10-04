<script setup lang="ts">
import { emailSchema } from '@timbre/contracts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { requestNotify } from '@/api/catalog'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'

interface Props {
  productId: string
}
const props = defineProps<Props>()
const { t } = useI18n()

const email = ref('')
const error = ref<'invalid' | 'failed' | null>(null)
const sending = ref(false)
const confirmed = ref<string | null>(null)

async function submit(): Promise<void> {
  const parsed = emailSchema.safeParse(email.value)
  if (!parsed.success) {
    error.value = 'invalid'
    return
  }
  error.value = null
  sending.value = true
  try {
    await requestNotify(props.productId, parsed.data)
    confirmed.value = parsed.data
  } catch {
    error.value = 'failed'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="card flex flex-col gap-3 p-4" aria-labelledby="notify-me-title">
    <h2 id="notify-me-title" class="text-heading text-ink">{{ t('notifyMe.title') }}</h2>
    <p
      v-if="confirmed"
      data-testid="notify-me-confirmation"
      role="status"
      class="text-body text-gain"
    >
      {{ t('notifyMe.confirmation', { email: confirmed }) }}
    </p>
    <form
      v-else
      data-testid="notify-me-form"
      class="flex flex-col gap-3"
      novalidate
      @submit.prevent="submit"
    >
      <p class="text-body-sm text-muted">{{ t('notifyMe.description') }}</p>
      <BaseInput
        v-model="email"
        name="notify-email"
        testid="notify-me-email"
        type="email"
        autocomplete="email"
        :label="t('notifyMe.email')"
        :error="error ? t(`notifyMe.${error}`) : undefined"
        :error-code="error === 'invalid' ? 'VALIDATION_ERROR' : undefined"
      />
      <BaseButton testid="notify-me-submit" type="submit" variant="outline" :loading="sending">
        {{ t('notifyMe.submit') }}
      </BaseButton>
    </form>
  </section>
</template>
