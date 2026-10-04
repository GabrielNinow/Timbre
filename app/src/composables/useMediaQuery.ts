import { onScopeDispose, shallowRef, type Ref } from 'vue'

export function useMediaQuery(query: string): Ref<boolean> {
  const matches = shallowRef(false)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return matches
  const list = window.matchMedia(query)
  matches.value = list.matches
  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }
  list.addEventListener('change', onChange)
  onScopeDispose(() => list.removeEventListener('change', onChange))
  return matches
}

/** The listing rail's breakpoint: below it the rail becomes a full-screen dialog. */
export const RAIL_BREAKPOINT = '(min-width: 768px)'
