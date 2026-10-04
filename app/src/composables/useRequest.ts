import { onScopeDispose, shallowRef, watch, type Ref, type ShallowRef } from 'vue'
import { ApiError, isAbort } from '@/api/client'

export type RequestStatus = 'loading' | 'error' | 'ready'

export interface RequestHandle<T> {
  status: Ref<RequestStatus>
  /** The last successful result. Kept while a newer request loads, so layout stays put. */
  data: ShallowRef<T | null>
  error: ShallowRef<ApiError | null>
  retry: () => void
}

/**
 * Runs `load` whenever `key` changes, cancelling the request it supersedes.
 * `key` is a string so that equivalent inputs never refetch.
 */
export function useRequest<T>(
  key: () => string,
  load: (signal: AbortSignal) => Promise<T>,
): RequestHandle<T> {
  const status = shallowRef<RequestStatus>('loading')
  const data = shallowRef<T | null>(null)
  const error = shallowRef<ApiError | null>(null)
  let controller: AbortController | null = null

  async function run(): Promise<void> {
    controller?.abort()
    const current = new AbortController()
    controller = current
    status.value = 'loading'
    error.value = null
    try {
      const result = await load(current.signal)
      if (current.signal.aborted) return
      data.value = result
      status.value = 'ready'
    } catch (caught) {
      if (isAbort(caught) || current.signal.aborted) return
      error.value =
        caught instanceof ApiError ? caught : new ApiError('NETWORK_ERROR', String(caught), null)
      status.value = 'error'
    }
  }

  watch(key, () => void run(), { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { status, data, error, retry: () => void run() }
}
