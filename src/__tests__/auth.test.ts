import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function generateUniqueEmail() {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `test-${ts}-${rand}@example.com`
}

async function signup(email: string, password: string, name?: string) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  const data = await res.json()
  return { status: res.status, data, cookies: res.headers.get('set-cookie') || '' }
}

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  return { status: res.status, data, cookies: res.headers.get('set-cookie') || '' }
}

async function me(sessionCookie?: string) {
  const headers: Record<string, string> = {}
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie
  }
  const res = await fetch(`${BASE}/api/auth/me`, { headers })
  const data = await res.json()
  return { status: res.status, data }
}

async function logout(sessionCookie?: string) {
  const headers: Record<string, string> = {}
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie
  }
  const res = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers })
  const data = await res.json()
  return { status: res.status, data }
}

function extractSessionCookie(setCookie: string): string | undefined {
  const match = setCookie.match(/session=([^;]+)/)
  return match ? `session=${match[1]}` : undefined
}

describe('Auth endpoints', () => {
  let serverAvailable = false

  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/me`, { method: 'GET' })
      serverAvailable = res.ok || res.status === 401 || res.status === 404
    } catch {
      serverAvailable = false
    }
  })

  it('requires a running Next.js server at NEXT_PUBLIC_APP_URL', () => {
    if (!serverAvailable) {
      throw new Error(`No server available at ${BASE}. Start the dev server to run auth integration tests.`)
    }
  })

  it('should reject signup with invalid email', async () => {
    const { status, data } = await signup('invalid-email', 'secret123')
    expect(status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should reject signup with short password', async () => {
    const { status, data } = await signup(generateUniqueEmail(), '12345')
    expect(status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should reject login with invalid credentials', async () => {
    const { status, data } = await login('no-such-user@example.com', 'wrong')
    expect(status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('should create a new user via signup and return session cookie', async () => {
    const email = generateUniqueEmail()
    const password = 'secret123'
    const name = 'Test User'

    const { status, data, cookies } = await signup(email, password, name)
    expect([200, 201]).toContain(status)
    expect(data.user).toBeTruthy()
    expect(data.user.email).toBe(email)
    expect(data.user.name).toBe(name)
    expect(cookies).toContain('session=')
  })

  it('should reject duplicate signup for the same email', async () => {
    const email = generateUniqueEmail()
    const { status: signupStatus } = await signup(email, 'secret123')
    expect([200, 201]).toContain(signupStatus)

    const { status } = await signup(email, 'secret123')
    expect(status).toBe(409)
  })

  it('should login with correct credentials and obtain user', async () => {
    const email = generateUniqueEmail()
    const password = 'secret123'

    const { status: signupStatus } = await signup(email, password)
    expect([200, 201]).toContain(signupStatus)

    const { status, data, cookies } = await login(email, password)
    expect(status).toBe(200)
    expect(data.user).toBeTruthy()
    expect(data.user.email).toBe(email)
    expect(cookies).toContain('session=')
  })

  it('should reject login with wrong password', async () => {
    const email = generateUniqueEmail()
    const password = 'secret123'

    const { status: signupStatus } = await signup(email, password)
    expect([200, 201]).toContain(signupStatus)

    const { status } = await login(email, 'wrong-password')
    expect(status).toBe(401)
  })

  it('should allow /me access when session cookie is present', async () => {
    const email = generateUniqueEmail()
    const password = 'secret123'

    await signup(email, password)
    const loginResult = await login(email, password)
    expect(loginResult.status).toBe(200)

    const sessionCookie = extractSessionCookie(loginResult.cookies)
    expect(sessionCookie).toBeTruthy()

    const { status, data } = await me(sessionCookie)
    expect(status).toBe(200)
    expect(data.user).toBeTruthy()
    expect(data.user.email).toBe(email)
  })

  it('should reject /me without session cookie', async () => {
    const { status, data } = await me()
    expect(status).toBe(401)
  })

  it('should logout successfully', async () => {
    const email = generateUniqueEmail()
    const password = 'secret123'

    await signup(email, password)
    const loginResult = await login(email, password)
    expect(loginResult.status).toBe(200)

    const sessionCookie = extractSessionCookie(loginResult.cookies)
    expect(sessionCookie).toBeTruthy()

    const { status, data } = await logout(sessionCookie)
    expect(status).toBe(200)
    expect(data.success).toBe(true)
  })
})
