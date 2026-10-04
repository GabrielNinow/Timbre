import { computed, nextTick, ref, type Ref } from 'vue'
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

  function blur(field: string): void {
    touched.add(field)
    const next = validateAll()
    const merged = { ...errors.value }
    if (next[field]) merged[field] = next[field]
    else delete merged[field]
    errors.value = merged
  }

  const summary = computed<FormError[]>(() =>
    order
      .filter((field) => errors.value[field])
      .map((field) => ({ field, name: options.fields[field]!, key: errors.value[field]! })),
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
    if (Object.keys(all).length > 0) {
      focusFirst()
      return null
    }
    return options.schema.parse(options.values())
  }

  /** Server-side field errors (422 `fields`) join the same summary. */
  function setServerErrors(next: Record<string, string>): void {
    errors.value = { ...errors.value, ...next }
    submitted.value = true
    focusFirst()
  }

  /** A field error found on blur (a CEP lookup, say): shown inline, no summary, no focus move. */
  function setFieldError(field: string, key: string): void {
    errors.value = { ...errors.value, [field]: key }
  }

  const errorFor = (field: string) => errors.value[field]
  return { errors, summary, submitted, blur, submit, setServerErrors, setFieldError, errorFor }
}
