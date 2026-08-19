<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  testid: string
  title?: string
  description?: string
  code?: string
  retryLabel?: string
  retrying?: boolean
  showRetry?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  description: undefined,
  code: undefined,
  retryLabel: undefined,
  retrying: false,
  showRetry: true,
})
defineEmits<{
  retry: []
}>()
const { t } = useI18n()

const heading = computed(() => props.title ?? t('errorState.title'))
const message = computed(() => props.description ?? t('errorState.description'))
const retryText = computed(() => props.retryLabel ?? t('common.retry'))
</script>
<template>
  <div
    :data-testid="testid"
    data-state="error"
    :data-error-code="code"
    role="alert"
    class="card flex flex-col items-center gap-3 border-fault px-6 py-12 text-center"
  >
    <p :data-testid="`${testid}-title`" class="text-heading text-ink">{{ heading }}</p>
    <p class="flex flex-wrap items-baseline justify-center gap-2">
      <span :data-testid="`${testid}-description`" class="text-body text-muted">
        {{ message }}
      </span>
      <span v-if="code" :data-testid="`${testid}-code`" class="font-mono text-mono text-muted">
        <span class="sr-only">{{ t('errorState.codeLabel') }} </span>{{ code }}
      </span>
    </p>
    <slot />
    <div
      v-if="showRetry || $slots.action"
      class="mt-1 flex flex-wrap items-center justify-center gap-2"
    >
      <BaseButton
        v-if="showRetry"
        :testid="`${testid}-retry`"
        variant="action"
        :loading="retrying"
        @click="$emit('retry')"
      >
        {{ retryText }}
      </BaseButton>
      <slot name="action" />
    </div>
  </div>
</template>