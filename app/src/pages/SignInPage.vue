<script setup lang="ts">
import { loginBodySchema } from '@timbre/contracts'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import AuthError from '@/components/checkout/AuthError.vue'
import ErrorSummary from '@/components/checkout/ErrorSummary.vue'
import { useForm } from '@/composables/useForm'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/config'
import { localizePath } from '@/lib/language'
import { safeRedirect } from '@/lib/redirect'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const language = usePageLanguage()
const auth = useAuthStore()

const values = reactive({ email: '', password: '' })
const form = useForm({ form: 'signIn', schema: loginBodySchema, values: () => values, fields: { email: 'email', password: 'password' } })
const pending = ref<string | null>(null)
const failure = ref<string | null>(null)

async function signIn(body: { email: string; password: string }, source: string): Promise<void> {
  pending.value = source
  failure.value = null
  try {
    await auth.signIn(body)
    await router.replace(safeRedirect(route.query.redirect, language.value))
  } catch (caught) {
    failure.value = caught instanceof ApiError ? caught.code : 'NETWORK_ERROR'
  } finally {
    pending.value = null
  }
}

function submit(): void {
  const body = form.submit()
  if (body) void signIn(body, 'form')
}
</script>

<template>
  <main id="main" data-testid="sign-in-page" class="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-8 md:px-6">
    <header class="flex flex-col gap-2">
      <h1 class="font-wide text-display-lg text-ink">{{ t('auth.signInTitle') }}</h1>
      <p class="text-body text-ink">{{ t('auth.signInLead') }}</p>
    </header>
    <AuthError :code="failure" />
    <div class="grid gap-6 md:grid-cols-2">
      <section class="card flex flex-col gap-3 p-5" aria-labelledby="demo-heading">
        <h2 id="demo-heading" class="text-heading text-ink">{{ t('auth.demoHeading') }}</h2>
        <ul class="flex flex-col gap-3">
          <li v-for="account in DEMO_ACCOUNTS" :key="account.key" data-testid="demo-account" :data-email="account.email" class="flex flex-col gap-1 border-b border-line pb-3 last:border-b-0">
            <span class="text-body font-semibold text-ink">{{ account.name }}</span>
            <span class="text-body-sm text-muted">{{ t(`auth.demo.${account.key}`) }}</span>
            <span class="font-mono text-mono text-muted">{{ account.email }} · {{ DEMO_PASSWORD }}</span>
            <BaseButton
              testid="demo-account-sign-in"
              :data-email="account.email"
              variant="outline"
              size="sm"
              class="self-start"
              :loading="pending === account.email"
              :disabled="pending !== null"
              @click="signIn({ email: account.email, password: DEMO_PASSWORD }, account.email)"
            >
              {{ t('auth.signInAs', { name: account.name }) }}
            </BaseButton>
          </li>
        </ul>
      </section>
      <section class="card flex flex-col gap-4 p-5" aria-labelledby="form-heading">
        <h2 id="form-heading" class="text-heading text-ink">{{ t('auth.formHeading') }}</h2>
        <ErrorSummary v-if="form.submitted.value" :errors="form.summary.value" />
        <form data-testid="sign-in-form" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
          <BaseInput v-model="values.email" name="email" type="email" autocomplete="email" required :label="t('auth.email')" :error="form.errorFor('email') && t(form.errorFor('email')!)" @blur="form.blur('email')" />
          <BaseInput v-model="values.password" name="password" type="password" autocomplete="current-password" required :label="t('auth.password')" :error="form.errorFor('password') && t(form.errorFor('password')!)" @blur="form.blur('password')" />
          <BaseButton testid="login-submit" type="submit" :loading="pending === 'form'" :disabled="pending !== null && pending !== 'form'">{{ t('auth.submit') }}</BaseButton>
        </form>
        <p class="text-body-sm text-muted">
          {{ t('auth.noAccount') }}
          <RouterLink data-testid="go-sign-up" :to="{ path: localizePath('/sign-up', language), query: route.query }" class="font-semibold text-band underline">{{ t('auth.createAccount') }}</RouterLink>
        </p>
      </section>
    </div>
  </main>
</template>
