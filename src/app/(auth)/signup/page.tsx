'use client'

import { useState } from 'react'
import { Heart, Mail, Lock, ArrowRight, User, Chrome } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useColorTheme } from '@/lib/theme'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const { theme } = useColorTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShake(false)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()
      if (!res.ok) {
        const status = res.status
        const message = data.error || `Signup failed (${status})`
        throw new Error(message)
      }

      const target = (redirect && redirect !== '/login') ? redirect : '/admin'
      setTimeout(() => {
        window.location.assign(target)
      }, 50)
    } catch (err: any) {
      setError(err.message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div
          className={`card p-8 ${shake ? 'animate-shake' : ''}`}
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-lg bg-card border border-base flex items-center justify-center hover:opacity-80 transition-opacity">
                <Heart className="w-7 h-7 accent" />
              </div>
            </Link>
            <h1 className="heading mb-2">Create Account</h1>
            <p className="muted-foreground">Join your love letter dashboard</p>
          </div>

          {error && (
            <div
              className="p-4 rounded-lg text-sm mb-6 border border-card-border bg-card/80 text-accent animate-fade-in-down"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Name"
              icon={User}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              icon={Lock}
              isPassword
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              icon={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-card-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card muted-foreground">Or continue with</span>
            </div>
          </div>

          {process.env.NEXT_PUBLIC_NEON_AUTH_GOOGLE_ENABLED === 'true' && (
            <a
              href={`${process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.NEON_AUTH_BASE_URL || ''}/oauth2/authorization/google`}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-card-border bg-base-2/50 text-text hover:bg-base-2 transition-colors mb-6"
            >
              <Chrome className="w-5 h-5" />
              <span className="font-medium">Continue with Google</span>
            </a>
          )}

          <div className="mt-6 text-center">
            <p className="muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/login" className="accent hover:opacity-80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
