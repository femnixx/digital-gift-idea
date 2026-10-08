import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, ensureProfileExists, createSession, getUserById, verifyNeonAuthToken, getOrCreateUserFromNeonAuth } from '@/lib/neon/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function userFriendlyMessage(code: number, fallback: string): string {
  switch (code) {
    case 400:
      return 'Please check your email and password.'
    case 401:
      return 'Invalid email or password.'
    case 403:
      return 'Your account is not allowed to sign in.'
    case 404:
      return 'Account not found.'
    case 409:
      return 'Email already registered.'
    case 422:
      return 'Please enter a valid email and password.'
    case 429:
      return 'Too many attempts. Please wait a moment and try again.'
    case 500:
      return 'Server error. Please try again later.'
    default:
      return fallback || 'Something went wrong. Please try again.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: userFriendlyMessage(400, 'Invalid request'), details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const neonAuthEndpoint = process.env.NEON_AUTH_ENDPOINT
    if (neonAuthEndpoint) {
      try {
        const res = await fetch(`${neonAuthEndpoint}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await res.json()
        if (res.ok && (data.access_token || data.token)) {
          const token = ((data.access_token || data.token) as unknown) as string
          const userId = await verifyNeonAuthToken(token)
          if (userId) {
            const user = await getOrCreateUserFromNeonAuth({
              sub: userId,
              email,
            })
            await ensureProfileExists(user.id, user.name || user.email)
            const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } })
            response.cookies.set('session', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
            })
            return response
          }
        }
      } catch {
        // fall through to direct DB
      }
    }

    const userRecord = await getUserByEmail(email)
    if (!userRecord) {
      return NextResponse.json({ error: userFriendlyMessage(401, 'Invalid email or password') }, { status: 401 })
    }

    const passwordHash = (userRecord as any).password_hash as string | undefined
    if (!passwordHash) {
      return NextResponse.json({ error: userFriendlyMessage(401, 'Invalid email or password') }, { status: 401 })
    }

    const valid = await verifyPassword(password, passwordHash)
    if (!valid) {
      return NextResponse.json({ error: userFriendlyMessage(401, 'Invalid email or password') }, { status: 401 })
    }

    const user = await getUserById(userRecord.id)
    if (!user) {
      return NextResponse.json({ error: userFriendlyMessage(401, 'Invalid email or password') }, { status: 401 })
    }

    await ensureProfileExists(user.id, user.name || user.email)

    const token = await createSession(user.id)

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json({ error: userFriendlyMessage(500, 'Internal server error') }, { status: 500 })
  }
}
