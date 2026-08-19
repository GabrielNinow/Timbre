<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  name: string
  modelValue: boolean
  label: string
  testid?: string
  value?: string
  disabled?: boolean
  indeterminate?: boolean
  error?: string
  errorCode?: string
  hint?: string
}
const props = withDefaults(defineProps<Props>(), {
  testid: undefined,
  value: undefined,
  disabled: false,
  indeterminate: false,
  error: undefined,
  errorCode: undefined,
  hint: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
defineSlots<{
  trailing?: () => unknown
}>()
const uid = useId()
const hintId = `${uid}-hint`
const errorId = `${uid}-error`

const controlTestid = computed(() => props.testid ?? `field-${props.name}`)
const state = computed(() => {
  if (props.disabled) return 'disabled'
  return props.error !== undefined ? 'error' : 'ready'
})
const describedBy = computed(() => {
  const ids = [props.hint !== undefined ? hintId : '', props.error !== undefined ? errorId : '']
  const joined = ids.filter(Boolean).join(' ')
  return joined.length > 0 ? joined : undefined
})
function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>
<template>
  <div
    :data-testid="`field-wrapper-${name}`"
    :data-state="state"
    :data-checked="modelValue ? 'true' : 'false'"
    :data-indeterminate="indeterminate ? 'true' : undefined"
    :data-value="value"
    class="flex flex-col gap-1"
  >
    <div class="flex items-start gap-2">
      <label
        :for="uid"
        class="flex flex-1 items-start gap-2 text-body"
        :class="disabled ? 'cursor-not-allowed text-muted' : 'cursor-pointer text-ink'"
      >
        <input
          :id="uid"
          type="checkbox"
          :data-testid="controlTestid"
          :name="name"
          :value="value"
          :checked="modelValue"
          :indeterminate.prop="indeterminate"
          :disabled="disabled"
          :aria-invalid="error !== undefined ? 'true' : undefined"
          :aria-describedby="describedBy"
          class="mt-1 size-4 shrink-0 cursor-pointer accent-band focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band aria-[invalid=true]:focus-visible:outline-fault disabled:cursor-not-allowed disabled:opacity-60"
          @change="onChange"
        >
        <span>{{ label }}</span>
      </label>
      <span v-if="$slots.trailing" class="shrink-0 text-body-sm text-muted">
        <slot name="trailing" />
      </span>
    </div>
    <p
      v-if="hint !== undefined"
      :id="hintId"
      :data-testid="`field-hint-${name}`"
      class="pl-6 text-body-sm text-muted"
    >
      {{ hint }}
    </p>
    <p
      v-if="error !== undefined"
      :id="errorId"
      :data-testid="`field-error-${name}`"
      :data-error-code="errorCode"
      class="pl-6 text-body-sm text-fault"
    >
      {{ error }}
    </p>
  </div>
</template>