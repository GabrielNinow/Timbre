import { inject, provide, type InjectionKey } from 'vue'

export interface Clock {
  now: () => number
  nowIso: () => string
}
export const clockKey = Symbol('timbre.clock') as InjectionKey<Clock>
/* eslint-disable no-restricted-syntax -- the one place wall time is read */
export const systemClock: Clock = {
  now: () => Date.now(),
  nowIso: () => new Date(Date.now()).toISOString(),
}
/* eslint-enable no-restricted-syntax */

export function fixedClock(epochMs: number): Clock {
  return {
    now: () => epochMs,
    nowIso: () => new Date(epochMs).toISOString(),
  }
}
export function provideClock(clock: Clock = systemClock): void {
  provide(clockKey, clock)
}
export function useClock(): Clock {
  return inject(clockKey, systemClock)
}