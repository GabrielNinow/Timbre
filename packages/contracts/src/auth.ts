import { z } from 'zod'
import { idString, isoDateTime } from './primitives.js'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(160)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'E-mail inválido')

export const passwordSchema = z
  .string()
  .min(8, 'Use ao menos 8 caracteres.')
  .max(72, 'Use no máximo 72 caracteres.')
  .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula.')
  .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula.')
  .regex(/\d/, 'Inclua ao menos um número.')
  .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um símbolo.')

export const userSchema = z.object({
  id: idString,
  name: z.string().min(1),
  email: emailSchema,
  createdAt: isoDateTime,
})
export type User = z.infer<typeof userSchema>

export const loginBodySchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.'),
})
export type LoginBody = z.infer<typeof loginBodySchema>

export const registerBodySchema = z.strictObject({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120),
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
