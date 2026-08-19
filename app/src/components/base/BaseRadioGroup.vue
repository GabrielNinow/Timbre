<script setup lang="ts">
import { computed, useId } from 'vue'

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}
interface Props {
  name: string
  modelValue: string
  label: string
  options: readonly RadioOption[]
  testid?: string
  optionTestid?: string
  optionAttr?: string
  orientation?: 'vertical' | 'horizontal'
  disabled?: boolean
  error?: string
  errorCode?: string
  hint?: string
}
const props = withDefaults(defineProps<Props>(), {
  testid: undefined,
  optionTestid: undefined,
  optionAttr: 'data-value',
  orientation: 'vertical',
  disabled: false,
  error: undefined,
  errorCode: undefined,
  hint: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
defineSlots<{
  option?: (props: { option: RadioOption; checked: boolean }) => unknown
}>()

const uid = useId()
const hintId = `${uid}-hint`
const errorId = `${uid}-error`
const groupTestid = computed(() => props.testid ?? `field-${props.name}`)
const optionTestidValue = computed(() => props.optionTestid ?? `field-${props.name}-option`)

const state = computed(() => {
  if (props.disabled) return 'disabled'
  return props.error !== undefined ? 'error' : 'ready'
})
const describedBy = computed(() => {
  const ids = [props.hint !== undefined ? hintId : '', props.error !== undefined ? errorId : '']
  const joined = ids.filter(Boolean).join(' ')
  return joined.length > 0 ? joined : undefined
})
function optionId(value: string): string {
  return `${uid}-${value}`
}
</script>
<template>
  <div
    :data-testid="`field-wrapper-${name}`"
    :data-state="state"
    :data-value="modelValue"
    class="flex flex-col gap-2"
  >
    <fieldset
      :data-testid="groupTestid"
      :data-orientation="orientation"
      :disabled="disabled"
      :aria-invalid="error !== undefined ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="flex min-w-0 flex-col gap-2"
    >
      <legend class="text-label text-muted uppercase">{{ label }}</legend>
      <div
        :class="
          orientation === 'horizontal' ? 'flex flex-wrap items-start gap-6' : 'flex flex-col gap-2'
        "
      >
        <label
          v-for="option in options"
          :key="option.value"
          :for="optionId(option.value)"
          :data-selected="option.value === modelValue ? 'true' : 'false'"
          :[optionAttr]="option.value"
          class="flex items-start gap-2 text-body"
          :class="
            disabled || option.disabled === true
              ? 'cursor-not-allowed text-muted'
              : 'cursor-pointer text-ink'
          "
        >
          <input
            :id="optionId(option.value)"
            type="radio"
            :data-testid="optionTestidValue"
            :[optionAttr]="option.value"
            :name="name"
            :value="option.value"
            :checked="option.value === modelValue"
            :disabled="option.disabled"
            class="mt-1 size-4 shrink-0 cursor-pointer accent-band focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            :class="error !== undefined ? 'focus-visible:outline-fault' : 'focus-visible:outline-band'"
            @change="emit('update:modelValue', option.value)"
          >
          <span class="min-w-0 flex-1">
            <slot name="option" :option="option" :checked="option.value === modelValue">
              <span class="block">{{ option.label }}</span>
              <span v-if="option.description !== undefined" class="block text-body-sm text-muted">
                {{ option.description }}
              </span>
            </slot>
          </span>
        </label>
      </div>
    </fieldset>
    <p
      v-if="hint !== undefined"
      :id="hintId"
      :data-testid="`field-hint-${name}`"
      class="text-body-sm text-muted"
    >
      {{ hint }}
    </p>
    <p
      v-if="error !== undefined"
      :id="errorId"
      :data-testid="`field-error-${name}`"
      :data-error-code="errorCode"
      class="text-body-sm text-fault"
    >
      {{ error }}
    </p>
  </div>
</template>