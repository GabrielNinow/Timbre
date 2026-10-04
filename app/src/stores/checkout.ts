import type { Address, Card, PaymentMethod } from '@timbre/contracts'
import { defineStore } from 'pinia'
import { shallowRef, watch } from 'vue'
import { readStored, writeStored } from '@/lib/storage'

/**
 * The checkout draft. It persists in `sessionStorage['timbre.checkout']` so a reload
 * or a test can resume mid-flow (docs/testability.md). The card never persists:
 * it lives in memory and is sent once with the order.
 */
export interface CheckoutDraft {
  address: Address | null
  method: PaymentMethod | null
  shippingDone: boolean
  paymentDone: boolean
}

const EMPTY: CheckoutDraft = { address: null, method: null, shippingDone: false, paymentDone: false }

function restore(): CheckoutDraft {
  try {
    const raw = readStored('checkout')
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<CheckoutDraft>) } : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

export const useCheckoutStore = defineStore('checkout', () => {
  const draft = shallowRef<CheckoutDraft>(restore())
  const card = shallowRef<Card | null>(null)

  watch(draft, (value) => writeStored('checkout', JSON.stringify(value)))

  function saveAddress(address: Address): void {
    draft.value = { ...draft.value, address, shippingDone: true }
  }

  function savePayment(method: PaymentMethod, nextCard: Card | null): void {
    card.value = method === 'card' ? nextCard : null
    draft.value = { ...draft.value, method, paymentDone: true }
  }

  /** Sends the Visitor back to payment: the method no longer fits, or the card is gone. */
  function reopenPayment(): void {
    draft.value = { ...draft.value, paymentDone: false }
  }

  function clear(): void {
    card.value = null
    draft.value = { ...EMPTY }
  }

  return { draft, card, saveAddress, savePayment, reopenPayment, clear }
})
