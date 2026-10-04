import type { z } from 'zod'

/**
 * Turns a shared Zod schema's issues into Platform copy keys. The schemas' own
 * messages are English developer text and are never shown to a Visitor; each
 * field shows `validation.<form>.<field>.<kind>`, translated in both locales.
 */

export type ValidationKind =
  | 'required'
  | 'invalid'
  | 'length'
  | 'lowercase'
  | 'uppercase'
  | 'number'
  | 'symbol'
  | 'brand'

const RULES: Array<[RegExp, ValidationKind]> = [
  [/\[a-z\]/, 'lowercase'],
  [/\[A-Z\]/, 'uppercase'],
  [/\\d/, 'number'],
  [/\[\^A-Za-z0-9\]/, 'symbol'],
]

function fieldOf(path: readonly PropertyKey[]): string {
  return path.map(String).join('.')
}

function kindOf(issue: z.core.$ZodIssue, value: unknown): ValidationKind {
  const raw = issue.path.reduce<unknown>((node, key) => (node as Record<PropertyKey, unknown>)?.[key], value)
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) return 'required'
  if (issue.code === 'too_small' || issue.code === 'too_big') return 'length'
  const isPassword = issue.path.at(-1) === 'password'
  if (isPassword && issue.code === 'invalid_format' && 'pattern' in issue && typeof issue.pattern === 'string') {
    for (const [pattern, kind] of RULES) if (pattern.test(issue.pattern)) return kind
  }
  if (issue.code === 'custom' && issue.path.at(-1) === 'cvv') return 'brand'
  return 'invalid'
}

export type ValidationForm = 'signIn' | 'signUp' | 'address' | 'card'

/** The first problem per field, as a locale key: `validation.address.street.required`. */
export function fieldErrors(form: ValidationForm, schema: z.ZodType, value: unknown): Record<string, string> {
  const result = schema.safeParse(value)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = fieldOf(issue.path)
    if (!(field in errors)) errors[field] = `validation.${form}.${field}.${kindOf(issue, value)}`
  }
  return errors
}
