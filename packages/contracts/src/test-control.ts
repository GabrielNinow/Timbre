import { z } from 'zod'
import { authResponseSchema } from './auth.js'
import { emailSchema } from './auth.js'
import { errorCodeSchema } from './errors.js'
import { isoDateTime } from './primitives.js'

export const testResetResponseSchema = z.object({
  ok: z.literal(true),
  durationMs: z.number().int().nonnegative(),
})
export type TestResetResponse = z.infer<typeof testResetResponseSchema>

export const testSessionBodySchema = z.strictObject({ email: emailSchema })
export type TestSessionBody = z.infer<typeof testSessionBodySchema>

export const testSessionResponseSchema = authResponseSchema
export type TestSessionResponse = z.infer<typeof testSessionResponseSchema>

export const testClockBodySchema = z.strictObject({ now: isoDateTime })
export type TestClockBody = z.infer<typeof testClockBodySchema>

export const testClockResponseSchema = z.object({ now: isoDateTime })
export type TestClockResponse = z.infer<typeof testClockResponseSchema>

export const testFailureBodySchema = z.strictObject({
  route: z.string().min(1).max(120),
  times: z.number().int().positive().max(50).default(1),
  status: z.number().int().min(400).max(599).default(500),
  code: errorCodeSchema.default('INJECTED_FAILURE'),
})
export type TestFailureBody = z.infer<typeof testFailureBodySchema>

export const testFailureResponseSchema = z.object({
  armed: z.array(
    z.object({
      route: z.string(),
      remaining: z.number().int().nonnegative(),
      status: z.number().int(),
      code: errorCodeSchema,
    }),
  ),
})
export type TestFailureResponse = z.infer<typeof testFailureResponseSchema>
