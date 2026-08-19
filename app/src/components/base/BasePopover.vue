<script setup lang="ts">
import {
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  testid: string
  contentTestid?: string
  title?: string
  description?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
  open?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  contentTestid: undefined,
  title: undefined,
  description: undefined,
  align: 'start',
  side: 'bottom',
  open: undefined,
})
defineEmits<{
  'update:open': [value: boolean]
}>()
defineSlots<{
  trigger: (props: { open: boolean }) => unknown
  default?: () => unknown
}>()
const { t } = useI18n()

const titleId = useId()
const descriptionId = useId()
const panelTestid = computed(() => props.contentTestid ?? `${props.testid}-content`)
const labelledBy = computed(() => {
  const attrs: Record<string, string> = {}
  if (props.title !== undefined) attrs['aria-labelledby'] = titleId
  if (props.description !== undefined) attrs['aria-describedby'] = descriptionId
  return attrs
})
</script>
<template>
  <PopoverRoot
    v-slot="{ open: isOpen }"
    :open="open"
    @update:open="$emit('update:open', $event)"
  >
    <PopoverTrigger
      as-child
      :data-testid="testid"
    >
      <slot name="trigger" :open="isOpen" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        v-bind="labelledBy"
        :data-testid="panelTestid"
        :side="side"
        :align="align"
        :side-offset="8"
        :collision-padding="16"
        class="card z-50 flex w-72 flex-col gap-3 p-4 shadow-lift transition-opacity duration-200 ease-out starting:opacity-0"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex flex-col gap-1">
            <p
              v-if="title"
              :id="titleId"
              :data-testid="`${panelTestid}-title`"
              class="text-heading text-ink"
            >
              {{ title }}
            </p>
            <p
              v-if="description"
              :id="descriptionId"
              :data-testid="`${panelTestid}-description`"
              class="text-body-sm text-muted"
            >
              {{ description }}
            </p>
          </div>
          <PopoverClose
            :data-testid="`${panelTestid}-close`"
            :aria-label="t('popover.close')"
            class="btn -mt-1 -mr-1 size-8 shrink-0 bg-transparent text-muted hover:bg-sunken hover:text-ink"
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
          </PopoverClose>
        </div>
        <div
          :data-testid="`${panelTestid}-body`"
          class="text-body text-ink"
        >
          <slot />
        </div>
        <PopoverArrow
          class="fill-surface stroke-line"
          :width="12"
          :height="6"
        />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>