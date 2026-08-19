import { computed, shallowRef, type ComputedRef } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export type ToastVariant = 'info' | 'success' | 'error'
export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  actionLabel?: string

  actionTo?: RouteLocationRaw
  testid?: string
  duration?: number
}
export interface ToastRecord extends ToastOptions {
  id: number
  variant: ToastVariant
  duration: number
  testid: string
}

export interface ToastApi {
  toasts: ComputedRef<ToastRecord[]>
  show: (options: ToastOptions) => number
  dismiss: (id: number) => void
  clear: () => void
}

export const TOAST_DEFAULT_DURATION = 5000
export const TOAST_MIN_DURATION = 4000
let lastId = 0

const records = shallowRef<ToastRecord[]>([])
const toasts = computed(() => records.value)
function resolveDuration(requested: number | undefined): number {
  if (requested === undefined) return TOAST_DEFAULT_DURATION
  if (requested <= 0) return 0
  return Math.max(requested, TOAST_MIN_DURATION)
}

function show(options: ToastOptions): number {
  lastId += 1
  const record: ToastRecord = {
    ...options,
    id: lastId,
    variant: options.variant ?? 'info',
    testid: options.testid ?? 'toast',
    duration: resolveDuration(options.duration),
  }
  records.value = [...records.value, record]
  return record.id
}
function dismiss(id: number): void {
  records.value = records.value.filter((record) => record.id !== id)
}
function clear(): void {
  records.value = []
}
export function useToast(): ToastApi {
  return { toasts, show, dismiss, clear }
}