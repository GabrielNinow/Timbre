import { computed, nextTick, ref, watch, type Ref } from 'vue'
import type { z } from 'zod'
import { fieldErrors, type ValidationForm } from '@/lib/validation'

export interface FormError {
  field: string
  /** The input's `name`: its testid is `field-<name>`, its error `field-error-<name>`. */
  name: string
  key: string
}

/**
 * Validation on blur and again on submit (docs/pages-and-components.md, Checkout).
 * A failed submit renders the error summary and moves focus to the first invalid
 * field, in the order the form lists them.
 */
export function useForm<T>(options: {
  form: ValidationForm
  schema: z.ZodType<T>
  values: () => unknown
  /** Schema field path → input name, in visual order. */
  fields: Record<string, string>
}) {
  const errors = ref<Record<string, string>>({}) as Ref<Record<string, string>>
  const touched = new Set<string>()
  const submitted = ref(false)
  const order = Object.keys(options.fields)

  function validateAll(): Record<string, string> {
    return fieldErrors(options.form, options.schema, options.values())
  }

  /**
   * A field already showing an error re-validates as the Visitor types, so the
   * error clears before they reach the submit button rather than on the blur that
   * clicking it fires (which would move the button mid-click).
   */
  /** Errors the schema cannot see (a CEP lookup, the server): they clear only when their own field changes. */
  const external = new Set<string>()
  const snapshot = () => ({ ...(options.values() as Record<string, unknown>) })
  let previous = snapshot()
  watch(
    () => JSON.stringify(options.values()),
    () => {
      const current = snapshot()
      const changed = new Set(Object.keys(current).filter((field) => current[field] !== previous[field]))
      previous = current
      const shown = Object.keys(errors.value)
      if (shown.length === 0) return
      const next = validateAll()
      const merged: Record<string, string> = {}
      for (const field of shown) {
        if (external.has(field) && !changed.has(field)) merged[field] = errors.value[field]!
        else if (next[field]) merged[field] = next[field]!
        else external.delete(field)
      }
      errors.value = merged
    },
  )

  function blur(field: string): void {
    touched.add(field)
    const next = validateAll()
    const merged = { ...errors.value }
    if (next[field]) merged[field] = next[field]
    else delete merged[field]
    errors.value = merged
  }

  /**
   * The summary lists what the last submit found and holds until the next submit.
   * It never collapses mid-click: the blur fired on the way to the submit button
   * must not shift that button out from under the pointer.
   */
  const reported = ref<string[]>([])
  const reportedKeys = ref<Record<string, string>>({})
  const summary = computed<FormError[]>(() =>
    order
      .filter((field) => reported.value.includes(field))
      .map((field) => ({ field, name: options.fields[field]!, key: errors.value[field] ?? reportedKeys.value[field]! })),
  )

  function focusFirst(): void {
    const first = summary.value[0]
    if (!first) return
    void nextTick(() => {
      const el = document.querySelector<HTMLElement>(`[data-testid="field-${first.name}"]`)
      el?.focus()
    })
  }

  /** Returns the parsed value, or null after showing every error. */
  function submit(): T | null {
    submitted.value = true
    const all = validateAll()
    errors.value = all
    reported.value = Object.keys(all)
    reportedKeys.value = all
    if (Object.keys(all).length > 0) {
      focusFirst()
      return null
    }
    return options.schema.parse(options.values())
  }

  /** Server-side field errors (422 `fields`) join the same summary. */
  function setServerErrors(next: Record<string, string>): void {
    for (const field of Object.keys(next)) external.add(field)
    errors.value = { ...errors.value, ...next }
    reported.value = [...new Set([...reported.value, ...Object.keys(next)])]
    reportedKeys.value = { ...reportedKeys.value, ...next }
    submitted.value = true
    focusFirst()
  }

  /** A field error found on blur (a CEP lookup, say): shown inline, no summary, no focus move. */
  function setFieldError(field: string, key: string): void {
    external.add(field)
    errors.value = { ...errors.value, [field]: key }
  }

  const errorFor = (field: string) => errors.value[field]
  return { errors, summary, submitted, blur, submit, setServerErrors, setFieldError, errorFor }
}
