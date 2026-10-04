import type { LoginBody, RegisterBody, User } from '@timbre/contracts'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import * as api from '@/api/auth'
import { readStored, writeStored } from '@/lib/storage'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'

/** The session token lives in `localStorage['timbre.session']`; the user comes from the API. */
export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null)
  const resolved = shallowRef(false)
  let booting: Promise<void> | null = null

  const signedIn = computed(() => user.value !== null)

  /** Resolves the stored token once. An invalid or expired token is dropped silently. */
  function ensure(): Promise<void> {
    booting ??= (async () => {
      if (readStored('session')) {
        try {
          user.value = await api.fetchMe()
        } catch {
          writeStored('session', null)
        }
      }
      resolved.value = true
    })()
    return booting
  }

  async function start(auth: { token: string; user: User }): Promise<void> {
    writeStored('session', auth.token)
    // The API merged the guest cart into the account; the guest id is now spent.
    writeStored('cart', null)
    user.value = auth.user
    await useCartStore().load()
  }

  async function signIn(body: LoginBody): Promise<void> {
    await start(await api.signIn(body))
  }

  async function signUp(body: RegisterBody): Promise<void> {
    await start(await api.signUp(body))
  }

  async function signOut(): Promise<void> {
    writeStored('session', null)
    writeStored('cart', null)
    user.value = null
    useCheckoutStore().clear()
    await useCartStore().load()
  }

  return { user, resolved, signedIn, ensure, signIn, signUp, signOut }
})
