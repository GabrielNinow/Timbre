<script setup lang="ts">
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

interface Option {
  value: string
  label: string
  disabled?: boolean
}
interface Props {
  name: string
  modelValue: string
  label: string
  options: readonly Option[]
  testid?: string
  placeholder?: string
  hint?: string
  error?: string
  errorCode?: string
  disabled?: boolean
  required?: boolean
  hideLabel?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  testid: undefined,
  placeholder: undefined,
  hint: undefined,
  error: undefined,
  errorCode: undefined,
  disabled: false,
  required: false,
  hideLabel: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
const { t } = useI18n()
const triggerId = useId()
const labelId = useId()
const hintId = useId()
const errorId = useId()
const controlTestid = computed(() => props.testid ?? `field-${props.name}`)
const hasError = computed(() => Boolean(props.error))

const state = computed(() => {
  if (hasError.value) return 'error'
  return props.disabled ? 'disabled' : 'ready'
})
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId)
  if (props.error) ids.push(errorId)
  return ids.length > 0 ? ids.join(' ') : undefined
})
const labelledBy = computed(() => `${labelId} ${triggerId}`)
function onValueChange(value: unknown) {
  if (typeof value === 'string') emit('update:modelValue', value)
}
</script>

<template>
  <div :data-testid="`field-wrapper-${name}`" :data-state="state" class="flex flex-col gap-1">
    <label
      :id="labelId"
      :for="triggerId"
      :class="hideLabel ? 'sr-only' : 'text-label text-muted uppercase'"
    >
      {{ label }}<span v-if="required" aria-hidden="true" class="text-fault"> *</span>
    </label>
    <SelectRoot
      :model-value="modelValue"
      :name="name"
      :disabled="disabled"
      :required="required"
      @update:model-value="onValueChange"
    >
      <SelectTrigger
        :id="triggerId"
        :data-testid="controlTestid"
        :data-value="modelValue"
        :aria-labelledby="labelledBy"
        :aria-describedby="describedBy"
        :aria-invalid="hasError ? 'true' : undefined"
        class="field flex h-10 items-center justify-between gap-2 px-3 text-left"
      >
        <SelectValue
          :placeholder="placeholder ?? t('select.placeholder')"
          class="min-w-0 truncate data-[placeholder]:text-muted"
        />
        <SelectIcon class="shrink-0 text-muted">
          <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <path
              d="m4 6.5 4 4 4-4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          :data-testid="`${controlTestid}-content`"
          position="popper"
          :side-offset="4"
          class="z-50 max-h-[var(--reka-select-content-available-height)] min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-control border border-line bg-surface shadow-lift"
        >
          <SelectViewport class="p-1">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              :data-testid="`${controlTestid}-option`"
              :data-value="option.value"
              :data-selected="option.value === modelValue ? 'true' : 'false'"
              class="flex cursor-default items-center justify-between gap-3 rounded-control px-3 py-2 text-body text-ink select-none data-[disabled]:cursor-not-allowed data-[disabled]:text-faint data-[highlighted]:bg-action-quiet data-[state=checked]:font-semibold"
            >
              <SelectItemText>{{ option.label }}</SelectItemText>
              <SelectItemIndicator class="shrink-0 text-band">
                <svg
                  class="size-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="m3.5 8.5 3 3 6-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <p
      v-if="hint"
      :id="hintId"
      :data-testid="`field-hint-${name}`"
      class="text-body-sm text-muted"
    >
      {{ hint }}
    </p>
    <p
      v-if="error"
      :id="errorId"
      :data-testid="`field-error-${name}`"
      :data-error-code="errorCode"
      class="text-body-sm text-fault"
    >
      {{ error }}
    </p>
  </div>
</template>