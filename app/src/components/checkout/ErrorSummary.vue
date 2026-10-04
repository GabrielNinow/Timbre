<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FormError } from '@/composables/useForm'

interface Props {
  errors: readonly FormError[]
  /** Interpolations some messages need, keyed by field. */
  params?: Record<string, Record<string, unknown>>
}
withDefaults(defineProps<Props>(), { params: () => ({}) })
const { t } = useI18n()

function focus(name: string): void {
  document.querySelector<HTMLElement>(`[data-testid="field-${name}"]`)?.focus()
}
</script>

<template>
  <div
    v-if="errors.length > 0"
    data-testid="form-error-summary"
    :data-count="errors.length"
    role="alert"
    class="rounded-card border border-fault bg-fault-quiet p-4"
  >
    <p class="text-body font-semibold text-fault">{{ t('errorSummary.title', { count: errors.length }, errors.length) }}</p>
    <ul class="mt-2 flex list-disc flex-col gap-1 pl-5">
      <li v-for="error in errors" :key="error.field" data-testid="form-error-summary-item" :data-field="error.name">
        <a :href="`#field-${error.name}`" class="text-body-sm text-fault underline" @click.prevent="focus(error.name)">
          {{ t(error.key, params[error.field] ?? {}) }}
        </a>
      </li>
    </ul>
  </div>
</template>
