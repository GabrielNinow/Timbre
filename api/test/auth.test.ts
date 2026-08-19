import type { AuthResponse } from '@timbre/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { createHarness, errorCodeOf, get, post, type Harness } from './helpers.js'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

const login = (email: string, password = 'Teste@1234') =>
  post(h.app, '/api/auth/login', { email, password })

describe('POST /api/auth/login', () => {
  it('signs in the clean buyer account', async () => {
    const response = await login('ana.souza@timbre.test')
    expect(response.statusCode).toBe(200)
    const body = response.json() as AuthResponse
    expect(body.user.email).toBe('ana.souza@timbre.test')
    expect(body.token).toBeTruthy()
  })

  it('signs in the account that has past orders', async () => {
    const response = await login('bruno.lima@timbre.test')
    expect(response.statusCode).toBe(200)
    expect((response.json() as AuthResponse).user.name).toBe('Bruno Lima')
  })

  it('rejects a locked account with ACCOUNT_LOCKED', async () => {
    const response = await login('bloqueado@timbre.test')
    expect(response.statusCode).toBe(403)
    expect(errorCodeOf(response)).toBe('ACCOUNT_LOCKED')
  })

  it('answers identically for a wrong password and an unknown e-mail', async () => {
    const wrongPassword = await login('ana.souza@timbre.test', 'Errada@1234')
    const unknownEmail = await login('ninguem@timbre.test')
    expect(wrongPassword.statusCode).toBe(401)
    expect(unknownEmail.statusCode).toBe(401)
    expect(errorCodeOf(wrongPassword)).toBe('INVALID_CREDENTIALS')
    expect(wrongPassword.body).toBe(unknownEmail.body)
  })

  it('holds the slow account for three seconds before succeeding', async () => {
    const startedAt = performance.now()
    const response = await login('lento@timbre.test')
    const elapsed = performance.now() - startedAt
    expect(response.statusCode).toBe(200)
    expect(elapsed).toBeGreaterThanOrEqual(2900)
  }, 10_000)

  it('rejects an unknown field in the body as malformed', async () => {
    const response = await post(h.app, '/api/auth/login', {
      email: 'ana.souza@timbre.test',
      password: 'Teste@1234',
      lembrar: true,
    })
    expect(response.statusCode).toBe(400)
    expect(errorCodeOf(response)).toBe('MALFORMED_REQUEST')
  })
})

describe('POST /api/auth/register', () => {
  it('creates an account and returns a session', async () => {
    const response = await post(h.app, '/api/auth/register', {
      name: 'Carla Dias',
      email: 'carla.dias@timbre.test',
      password: 'Teste@1234',
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as AuthResponse
    expect(body.user.id).toBe('u-06')
    expect(body.token).toBe('tok_u-06_novo')
  })

  it('rejects an e-mail that already exists', async () => {
    const response = await post(h.app, '/api/auth/register', {
      name: 'Outra Ana',
      email: 'ana.souza@timbre.test',
      password: 'Teste@1234',
    })
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('EMAIL_TAKEN')
    expect((response.json() as { error: { fields: Record<string, string> } }).error.fields).toHaveProperty('email')
  })

  it('applies the shared password rules', async () => {
    const response = await post(h.app, '/api/auth/register', {
      name: 'Carla Dias',
      email: 'carla2@timbre.test',
      password: 'fraca',
    })
    expect(response.statusCode).toBe(422)
    expect(errorCodeOf(response)).toBe('VALIDATION_ERROR')
    expect((response.json() as { error: { fields: Record<string, string> } }).error.fields).toHaveProperty(
      'password',
    )
  })
})

describe('GET /api/auth/me', () => {
  it('returns the signed-in user', async () => {
    const token = (await login('ana.souza@timbre.test')).json<AuthResponse>().token
    const response = await get(h.app, '/api/auth/me', { token })
    expect(response.statusCode).toBe(200)
  })

  it('401s without a token', async () => {
    const response = await get(h.app, '/api/auth/me')
    expect(response.statusCode).toBe(401)
    expect(errorCodeOf(response)).toBe('UNAUTHORIZED')
  })

  it('401s on an unknown token', async () => {
    const response = await get(h.app, '/api/auth/me', { token: 'tok_inexistente' })
    expect(response.statusCode).toBe(401)
  })
})
