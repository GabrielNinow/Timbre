<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  code: string | null
}
defineProps<Props>()
const { t, te } = useI18n()
const message = (code: string) => (te(`auth.errors.${code}`) ? t(`auth.errors.${code}`) : t('auth.errors.fallback'))
</script>

<template>
  <p v-if="code" data-testid="auth-error" :data-error-code="code" role="alert" class="rounded-card border border-fault bg-fault-quiet p-3 text-body text-fault">
    {{ message(code) }}
  </p>
</template>
