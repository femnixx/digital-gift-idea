'use client'

import { useState } from 'react'
import { Heart, Mail, Lock, ArrowRight, User, Eye, EyeOff, CheckCircle2, Chrome } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useColorTheme } from '@/lib/theme'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const { theme } = useColorTheme()

  const redirect = searchParams.get('redirect') || '/admin'
  const authError = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'no_token':
        return 'Authentication failed. Please try again.'
      case 'invalid_token':
        return 'Invalid authentication token. Please try again.'
      case 'auth_failed':
        return 'Authentication failed. Please try again.'
      default:
        return ''
    }
  }

  const displayError = authError ? getErrorMessage(authError) : error

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShake(false)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        const status = res.status
        const message = data.error || `Login failed (${status})`
        throw new Error(message)
      }

      router.push(redirect)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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

      setError('Account created! Signing you in...')
      setTimeout(() => {
        router.push(redirect)
        router.refresh()
      }, 800)
    } catch (err: any) {
      setError(err.message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')
    setResetSent(false)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, password: '__reset_request__' }),
      })
      setResetSent(true)
    } catch {
      setResetError('Something went wrong. Try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div
          ref={typeof document !== 'undefined' ? null : undefined}
          className={`card p-8 ${shake ? 'animate-shake' : ''}`}
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-lg bg-card border border-base flex items-center justify-center hover:opacity-80 transition-opacity">
                <Heart className="w-7 h-7 accent" />
              </div>
            </Link>
            <h1 className="heading mb-2">
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="muted-foreground">
              {activeTab === 'signin'
                ? 'Sign in to your love letter dashboard'
                : 'Join your love letter dashboard'}
            </p>
          </div>

          <div className="flex mb-6 bg-base-2/50 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('signin'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'signin'
                  ? 'bg-card text-accent shadow-sm border border-card-border'
                  : 'muted-foreground hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'signup'
                  ? 'bg-card text-accent shadow-sm border border-card-border'
                  : 'muted-foreground hover:text-text'
              }`}
            >
              Sign Up
            </button>
          </div>

          {displayError && (
            <div
              className="p-4 rounded-lg text-sm mb-6 border border-card-border bg-card/80 text-accent animate-fade-in-down"
            >
              {displayError}
            </div>
          )}

          {showReset ? (
            <form onSubmit={handleReset} className="space-y-4 mb-6">
              {resetSent ? (
                <div className="p-4 rounded-lg border border-card-border bg-card text-accent text-sm">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Check your email for the reset link
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="p-3 rounded-lg border border-card-border bg-card text-accent text-sm">
                      {resetError}
                    </div>
                  )}
                  <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="px-4 py-2 rounded-lg border border-card-border muted-foreground hover:text-text hover:bg-base-2/50 transition-colors text-sm"
                    >
                      Back
                    </button>
                    <Button
                      type="submit"
                      disabled={resetLoading}
                      loading={resetLoading}
                    >
                      Send Reset Link
                    </Button>
                  </div>
                </>
              )}
            </form>
            ) : activeTab === 'signup' ? (
              <form onSubmit={handleSignUp} className="space-y-6 mb-6">
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
            ) : (
              <form onSubmit={handleSignIn} className="space-y-6 mb-6">
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
                  autoComplete="current-password"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  icon={ArrowRight}
                >
                  Sign In
                </Button>
              </form>
            )}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-card-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card muted-foreground">Or continue with</span>
              </div>
            </div>

            <a
              href={`${process.env.NEXT_PUBLIC_NEON_AUTH_URL || ''}/auth/google`}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-card-border bg-base-2/50 text-text hover:bg-base-2 transition-colors mb-6"
            >
              <Chrome className="w-5 h-5" />
              <span className="font-medium">Continue with Google</span>
            </a>

          {activeTab === 'signin' && !showReset && (
            <>
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setActiveTab('signup'); setError('') }}
                  className="accent hover:opacity-80 font-medium"
                >
                  Create account
                </button>
                <button
                  onClick={() => { setShowReset(true); setError('') }}
                  className="muted-foreground hover:opacity-80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {activeTab === 'signup' && (
            <div className="mt-6 text-center">
              <p className="muted-foreground text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => { setActiveTab('signin'); setError('') }}
                  className="accent hover:opacity-80 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
