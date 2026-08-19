<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  testid: string
  open: boolean
  title: string
  description?: string
  size?: 'md' | 'lg' | 'full'
}
const props = withDefaults(defineProps<Props>(), {
  description: undefined,
  size: 'md',
})
defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const describedBy = computed(() =>
  props.description === undefined ? { 'aria-describedby': 'undefined' } : {},
)
const sizes: Record<NonNullable<Props['size']>, string> = {
  md: 'fixed top-1/2 left-1/2 w-[calc(100%_-_2rem)] max-w-lg max-h-[85dvh] -translate-x-1/2 -translate-y-1/2 rounded-card',
  lg: 'fixed top-1/2 left-1/2 w-[calc(100%_-_2rem)] max-w-3xl max-h-[85dvh] -translate-x-1/2 -translate-y-1/2 rounded-card',
  full: 'fixed inset-0',
}
</script>
<template>
  <DialogRoot
    :open="open"
    @update:open="$emit('update:open', $event)"
  >
    <DialogPortal>
      <DialogOverlay
        :data-testid="`${testid}-overlay`"
        class="fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 ease-out starting:opacity-0"
      />
      <DialogContent
        v-bind="describedBy"
        :data-testid="testid"
        :data-size="size"
        class="z-50 flex flex-col overflow-y-auto overscroll-contain bg-surface text-ink shadow-lift transition-opacity duration-200 ease-out starting:opacity-0"
        :class="sizes[size]"
      >
        <header
          class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-4"
        >
          <div class="flex flex-col gap-1">
            <DialogTitle :data-testid="`${testid}-title`" class="text-heading text-ink">
              {{ title }}
            </DialogTitle>
            <DialogDescription
              v-if="description"
              :data-testid="`${testid}-description`"
              class="text-body-sm text-muted"
            >
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            :data-testid="`${testid}-close`"
            :aria-label="t('dialog.close')"
            class="btn size-8 shrink-0 bg-transparent text-muted hover:bg-sunken hover:text-ink"
          >
            <svg
              class="size-4"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="m4 4 8 8M12 4l-8 8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </DialogClose>
        </header>
        <div
          :data-testid="`${testid}-body`"
          class="flex-1 px-6 py-4"
        >
          <slot />
        </div>
        <footer
          v-if="$slots.footer"
          :data-testid="`${testid}-footer`"
          class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-surface px-6 py-4"
        >
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>