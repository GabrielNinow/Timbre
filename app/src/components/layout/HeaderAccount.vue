<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BasePopover from '@/components/base/BasePopover.vue'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { localizePath } from '@/lib/language'
import { signInLocation } from '@/lib/redirect'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const language = usePageLanguage()
const auth = useAuthStore()
void auth.ensure()
const open = ref(false)

async function signOut(): Promise<void> {
  open.value = false
  await auth.signOut()
  if (route.meta.auth) await router.push(localizePath('/', language.value))
}
</script>

<template>
  <BasePopover v-if="auth.user" v-model:open="open" testid="header-account" content-testid="header-account-menu" align="end" :title="t('account.menu')">
    <template #trigger>
      <button type="button" :data-user-id="auth.user.id" class="btn h-10 px-3 text-body text-on-band hover:bg-band-hover focus-visible:outline-on-band">
        {{ t('account.greeting', { name: auth.user.name.split(' ')[0] }) }}
      </button>
    </template>
    <nav class="flex flex-col">
      <RouterLink data-testid="header-account-orders" :to="localizePath('/account/orders', language)" class="rounded-control px-2 py-2 text-body text-ink hover:bg-sunken" @click="open = false">
        {{ t('account.orders') }}
      </RouterLink>
      <button type="button" data-testid="sign-out" class="rounded-control px-2 py-2 text-left text-body text-ink hover:bg-sunken" @click="signOut">
        {{ t('account.signOut') }}
      </button>
    </nav>
  </BasePopover>
  <RouterLink
    v-else
    data-testid="header-account"
    :to="route.name === 'login' ? route.fullPath : signInLocation(route.fullPath, language)"
    class="btn h-10 shrink-0 px-3 text-body text-on-band hover:bg-band-hover focus-visible:outline-on-band"
  >
    {{ t('account.signIn') }}
  </RouterLink>
</template>
