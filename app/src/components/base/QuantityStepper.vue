<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  testid: string
  modelValue: number
  max: number
  min?: number
  label?: string
  hideLabel?: boolean
  disabled?: boolean
  noticeTestid?: string
}
const props = withDefaults(defineProps<Props>(), {
  min: 1,
  label: undefined,
  hideLabel: true,
  disabled: false,
  noticeTestid: undefined,
})
const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()
const { t } = useI18n()
const inputId = useId()
const noticeId = useId()
const draft = ref(String(props.modelValue))
watch(
  () => props.modelValue,
  (value) => {
    draft.value = String(value)
  },
)

const unavailable = computed(() => props.max <= 0 || props.max < props.min)
const inert = computed(() => props.disabled || unavailable.value)

const atMax = computed(() => props.modelValue >= props.max)
const atMin = computed(() => props.modelValue <= props.min)
const showNotice = computed(() => atMax.value && !unavailable.value)
const resolvedLabel = computed(() => props.label ?? t('quantity.label'))
const resolvedNoticeTestid = computed(() => props.noticeTestid ?? `${props.testid}-limit-notice`)
function clamp(value: number): number {
  return Math.min(Math.max(value, props.min), props.max)
}
function parse(raw: string): number {
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? props.min : clamp(parsed)
}
function commit(value: number): void {
  draft.value = String(value)
  if (value !== props.modelValue) emit('update:modelValue', value)
}
function commitDraft(): void {
  commit(parse(draft.value))
}
function step(delta: number): void {
  commit(clamp(props.modelValue + delta))
}
</script>
<template>
  <div
    :data-testid="testid"
    :data-at-max="atMax ? 'true' : 'false'"
    :data-at-min="atMin ? 'true' : 'false'"
    :data-max="max"
    :data-min="min"
    :data-disabled="inert ? 'true' : 'false'"
    class="flex flex-col gap-2"
  >
    <label :for="inputId" :class="hideLabel ? 'sr-only' : 'text-label text-muted uppercase'">
      {{ resolvedLabel }}
    </label>
    <div class="flex items-center gap-2">
      <button
        :data-testid="`${testid}-decrease`"
        type="button"
        :disabled="inert || atMin"
        :aria-label="t('quantity.decrease')"
        class="btn size-10 bg-transparent text-band hover:bg-sunken"
        @click="step(-1)"
      >
        <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <input
        :id="inputId"
        v-model="draft"
        :data-testid="`${testid}-input`"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :disabled="inert"
        :aria-describedby="showNotice ? noticeId : undefined"
        class="field h-10 w-14 px-2 text-center"
        @change="commitDraft"
        @blur="commitDraft"
        @keydown.enter.prevent="commitDraft"
        @keydown.up.prevent="step(1)"
        @keydown.down.prevent="step(-1)"
      >
      <button
        :data-testid="`${testid}-increase`"
        type="button"
        :disabled="inert || atMax"
        :aria-label="t('quantity.increase')"
        class="btn size-10 bg-transparent text-band hover:bg-sunken"
        @click="step(1)"
      >
        <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>
    <p
      v-if="showNotice"
      :id="noticeId"
      :data-testid="resolvedNoticeTestid"
      aria-live="polite"
      class="text-body-sm text-fault"
    >
      {{ t('quantity.atMax', { max }, max) }}
    </p>
  </div>
</template>