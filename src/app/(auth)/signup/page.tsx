'use client'

import { useState, useEffect } from 'react'
import { Heart, Mail, Lock, ArrowRight, Loader2, CheckCircle2, User, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ensureProfileExists } from '@/lib/auth'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useColorTheme } from '@/lib/theme'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const { theme } = useColorTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShake(false)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name || email.split('@')[0],
        },
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    })

    if (authError) {
      setError(authError.message)
      setShake(true)
      setLoading(false)
      setTimeout(() => setShake(false), 500)
    } else if (data.user) {
      await ensureProfileExists(data.user.id, name || email.split('@')[0])

      if (!data.user.confirmed_at) {
        setSuccess(true)
      } else {
        router.push(redirect)
        router.refresh()
      }
    }
  }

  const handleOAuth = async (provider: 'google' | 'github' | 'apple') => {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="card p-8 text-center">
            <CheckCircle2 className="w-12 h-12 accent mx-auto mb-4" />
            <h1 className="heading mb-2">Check Your Email</h1>
            <p className="muted-foreground mb-2">We sent a verification link to {email}</p>
            <p className="muted-foreground text-sm">Click the link to verify your account and start creating love letters.</p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 mt-6">
              <ArrowRight className="w-4 h-4" />
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
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

          <div className="mt-6 space-y-3">
            <p className="text-center muted-foreground text-sm">Or sign up with</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Google', provider: 'google' },
                { name: 'GitHub', provider: 'github' },
                { name: 'Apple', provider: 'apple' },
              ].map(({ name, provider }) => (
                <button
                  key={provider}
                  onClick={() => handleOAuth(provider as 'google' | 'github' | 'apple')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-lg border border-base bg-card hover:bg-base/50 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm capitalize">{name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/login" className="accent hover:opacity-80 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center muted-foreground text-xs mt-6">
            Demo mode: any email/password works
          </p>
        </div>
      </div>
    </div>
  )
}
