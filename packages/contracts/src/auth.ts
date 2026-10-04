import { z } from 'zod'
import { idString, isoDateTime } from './primitives.js'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(160)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email')

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use at most 72 characters.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/\d/, 'Include at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Include at least one symbol.')

export const userSchema = z.object({
  id: idString,
  name: z.string().min(1),
  email: emailSchema,
  createdAt: isoDateTime,
})
export type User = z.infer<typeof userSchema>

export const loginBodySchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Enter the password.'),
})
export type LoginBody = z.infer<typeof loginBodySchema>

export const registerBodySchema = z.strictObject({
  name: z.string().trim().min(2, 'Enter your name.').max(120),
  email: emailSchema,
  password: passwordSchema,
})
export type RegisterBody = z.infer<typeof registerBodySchema>

export const authResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
})
export type AuthResponse = z.infer<typeof authResponseSchema>

export const meResponseSchema = z.object({ user: userSchema })
export type MeResponse = z.infer<typeof meResponseSchema>
