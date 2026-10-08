import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, ensureProfileExists, createSession } from '@/lib/neon/auth'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
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
    const validation = signupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: userFriendlyMessage(400, 'Invalid request'), details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: userFriendlyMessage(409, 'Email already registered') }, { status: 409 })
    }

    const user = await createUser(email, password, name)
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
    console.error('Error in signup:', error)
    return NextResponse.json({ error: userFriendlyMessage(500, 'Internal server error') }, { status: 500 })
  }
}
