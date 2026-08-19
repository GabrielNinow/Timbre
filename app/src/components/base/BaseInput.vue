<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  name: string
  modelValue: string
  label: string
  testid?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'search' | 'number'
  size?: 'sm' | 'md'
  placeholder?: string
  hint?: string
  error?: string
  errorCode?: string
  disabled?: boolean
  required?: boolean
  readonly?: boolean
  autocomplete?: string
  inputmode?: 'text' | 'numeric' | 'tel' | 'email' | 'search'
  maxlength?: number
  hideLabel?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  testid: undefined,
  type: 'text',
  size: 'md',
  placeholder: undefined,
  hint: undefined,
  error: undefined,
  errorCode: undefined,
  disabled: false,
  required: false,
  readonly: false,
  autocomplete: undefined,
  inputmode: undefined,
  maxlength: undefined,
  hideLabel: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
}>()
const inputId = useId()
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
const shellSizes: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 px-3',
  md: 'h-10 px-3',
}
const textSizes: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-body-sm',
  md: 'text-body',
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
function onBlur(event: FocusEvent) {
  emit('blur', event)
}
</script>
<template>
  <div :data-testid="`field-wrapper-${name}`" :data-state="state" class="flex flex-col gap-1">
    <label :for="inputId" :class="hideLabel ? 'sr-only' : 'text-label text-muted uppercase'">
      {{ label }}<span v-if="required" aria-hidden="true" class="text-fault"> *</span>
    </label>
    <div
      class="field flex items-center gap-2 focus-within:outline-2 focus-within:outline-offset-0"
      :class="[
        shellSizes[size],
        hasError
          ? 'border-fault focus-within:outline-fault'
          : 'focus-within:border-band focus-within:outline-band',
        disabled ? 'cursor-not-allowed bg-sunken' : '',
      ]"
    >
      <input
        :id="inputId"
        :data-testid="controlTestid"
        :name="name"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :aria-describedby="describedBy"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-required="required ? 'true' : undefined"
        class="min-w-0 flex-1 bg-transparent font-ui text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:text-muted"
        :class="textSizes[size]"
        @input="onInput"
        @blur="onBlur"
      >
      <span v-if="$slots.trailing" class="flex shrink-0 items-center">
        <slot name="trailing" />
      </span>
    </div>
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