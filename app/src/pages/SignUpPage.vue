<script setup lang="ts">
import { registerBodySchema } from '@timbre/contracts'
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
import { localizePath } from '@/lib/language'
import { safeRedirect } from '@/lib/redirect'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const language = usePageLanguage()
const auth = useAuthStore()

const values = reactive({ name: '', email: '', password: '' })
const form = useForm({
  form: 'signUp',
  schema: registerBodySchema,
  values: () => values,
  fields: { name: 'name', email: 'email', password: 'password' },
})
const loading = ref(false)
const failure = ref<string | null>(null)
const emailTaken = ref(false)

async function submit(): Promise<void> {
  const body = form.submit()
  if (!body) return
  loading.value = true
  failure.value = null
  emailTaken.value = false
  try {
    await auth.signUp(body)
    await router.replace(safeRedirect(route.query.redirect, language.value))
  } catch (caught) {
    const code = caught instanceof ApiError ? caught.code : 'NETWORK_ERROR'
    if (code === 'EMAIL_TAKEN') {
      emailTaken.value = true
      form.setServerErrors({ email: 'auth.errors.EMAIL_TAKEN' })
    } else failure.value = code
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main id="main" data-testid="sign-up-page" class="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-8 md:px-6">
    <header class="flex flex-col gap-2">
      <h1 class="font-wide text-display-lg text-ink">{{ t('auth.signUpTitle') }}</h1>
      <p class="text-body text-ink">{{ t('auth.signUpLead') }}</p>
    </header>
    <AuthError :code="failure" />
    <section class="card flex flex-col gap-4 p-5">
      <ErrorSummary v-if="form.submitted.value" :errors="form.summary.value" />
      <form data-testid="sign-up-form" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <BaseInput v-model="values.name" name="name" autocomplete="name" required :label="t('auth.name')" :error="form.errorFor('name') && t(form.errorFor('name')!)" @blur="form.blur('name')" />
        <BaseInput
          v-model="values.email"
          name="email"
          type="email"
          autocomplete="email"
          required
          :label="t('auth.email')"
          :error="form.errorFor('email') && t(form.errorFor('email')!)"
          :error-code="emailTaken ? 'EMAIL_TAKEN' : undefined"
          @blur="form.blur('email')"
        />
        <BaseInput
          v-model="values.password"
          name="password"
          type="password"
          autocomplete="new-password"
          required
          :label="t('auth.password')"
          :hint="t('auth.passwordHint')"
          :error="form.errorFor('password') && t(form.errorFor('password')!)"
          @blur="form.blur('password')"
        />
        <BaseButton testid="sign-up-submit" type="submit" :loading="loading">{{ t('auth.signUpSubmit') }}</BaseButton>
      </form>
      <p class="text-body-sm text-muted">
        {{ t('auth.haveAccount') }}
        <RouterLink data-testid="go-sign-in" :to="{ path: localizePath('/sign-in', language), query: route.query }" class="font-semibold text-band underline">{{ t('auth.goSignIn') }}</RouterLink>
      </p>
    </section>
  </main>
</template>
