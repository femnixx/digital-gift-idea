import { NextResponse } from 'next/server'
import { createUser, hashPassword } from '@/lib/neon/auth'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const user = await createUser(email, password, name)

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 })

    const token = await (await import('@/lib/neon/auth')).createSession(user.id)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 400 })
  }
}