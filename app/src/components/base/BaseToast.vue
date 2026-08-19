<script setup lang="ts">
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from 'reka-ui'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import { TOAST_DEFAULT_DURATION, useToast, type ToastVariant } from '@/composables/useToast'

const { t } = useI18n()
const { toasts, dismiss } = useToast()
const tones: Record<ToastVariant, string> = {
  info: 'border-line border-l-line-heavy',
  success: 'border-gain border-l-gain',
  error: 'border-fault border-l-fault',
}

function announcement(variant: ToastVariant): 'foreground' | 'background' {
  return variant === 'error' ? 'foreground' : 'background'
}
function onOpenChange(open: boolean, id: number): void {
  if (!open) dismiss(id)
}
</script>
<template>
  <ToastProvider :label="t('toast.region')" :duration="TOAST_DEFAULT_DURATION">
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :data-testid="toast.testid"
      :data-toast-variant="toast.variant"
      :duration="toast.duration"
      :type="announcement(toast.variant)"
      class="card pointer-events-auto flex w-full items-start gap-3 border-l-4 p-3 shadow-lift"
      :class="tones[toast.variant]"
      @update:open="(open: boolean) => onOpenChange(open, toast.id)"
    >
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <span class="sr-only">{{ t(`toast.variant.${toast.variant}`) }}</span>
        <ToastTitle class="text-body font-semibold text-ink">{{ toast.title }}</ToastTitle>
        <ToastDescription v-if="toast.description" class="text-body-sm text-muted">
          {{ toast.description }}
        </ToastDescription>
        <ToastAction
          v-if="toast.actionLabel"
          :alt-text="toast.actionLabel"
          :as="toast.actionTo ? 'a' : 'button'"
          as-child
        >
          <BaseButton
            :testid="`${toast.testid}-action`"
            :to="toast.actionTo"
            variant="outline"
            size="sm"
            class="mt-1 self-start"
          >
            {{ toast.actionLabel }}
          </BaseButton>
        </ToastAction>
      </div>
      <ToastClose
        :data-testid="`${toast.testid}-close`"
        :aria-label="t('toast.close')"
        class="btn -mt-1 -mr-1 size-8 shrink-0 text-muted hover:bg-sunken hover:text-ink"
      >
        <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <path
            d="m4 4 8 8M12 4l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </ToastClose>
    </ToastRoot>
    <ToastViewport
      data-testid="toast-region"
      class="pointer-events-none fixed right-0 bottom-0 z-50 flex w-full max-w-96 flex-col gap-2 p-4"
    />
  </ToastProvider>
</template>