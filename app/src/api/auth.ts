import {
  authResponseSchema,
  meResponseSchema,
  type AuthResponse,
  type LoginBody,
  type RegisterBody,
  type User,
} from '@timbre/contracts'
import { apiGet, apiSend } from '@/api/client'

/** Sign-in and sign-up send the guest cart id, so the API merges it into the account. */
export function signIn(body: LoginBody): Promise<AuthResponse> {
  return apiSend('/auth/login', authResponseSchema, { method: 'POST', body })
}

export function signUp(body: RegisterBody): Promise<AuthResponse> {
  return apiSend('/auth/register', authResponseSchema, { method: 'POST', body })
}

export async function fetchMe(): Promise<User> {
  return (await apiGet('/auth/me', meResponseSchema)).user
}
