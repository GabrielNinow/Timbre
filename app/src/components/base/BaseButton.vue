<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

interface Props {
  testid: string
  variant?: 'action' | 'outline' | 'quiet' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  to?: RouteLocationRaw
  href?: string
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'action',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  block: false,
  to: undefined,
  href: undefined,
})
const inert = computed(() => props.disabled || props.loading)
const tag = computed(() => {
  if (inert.value) return 'button'
  if (props.to !== undefined) return RouterLink
  if (props.href !== undefined) return 'a'
  return 'button'
})
const variants: Record<NonNullable<Props['variant']>, string> = {
  action: 'bg-action text-on-action hover:bg-action-hover',
  outline: 'border-band bg-surface text-band hover:bg-action-quiet',
  quiet: 'bg-transparent text-band hover:bg-sunken',
  danger: 'border-fault bg-fault-quiet text-fault hover:bg-fault hover:text-surface',
}
const sizes: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 px-3 text-body-sm',
  md: 'h-10 px-4 text-body',
  lg: 'h-12 px-6 text-body',
}
</script>
<template>
  <component
    :is="tag"
    :data-testid="testid"
    :data-variant="variant"
    :data-loading="loading ? 'true' : undefined"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' && inert ? true : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :to="tag === RouterLink ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    class="btn relative"
    :class="[variants[variant], sizes[size], block ? 'w-full' : '']"
  >
    <span class="inline-flex items-center gap-2" :class="loading ? 'opacity-0' : ''">
      <slot />
    </span>
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <svg
        class="size-4 animate-spin"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
        <path
          d="M14 8a6 6 0 0 0-6-6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </span>
  </component>
</template>