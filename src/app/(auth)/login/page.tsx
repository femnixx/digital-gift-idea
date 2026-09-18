'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Heart, Mail, Lock, ArrowRight, Loader2, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const OAUTH_PROVIDERS = [
  { name: 'Google', provider: 'google' as const },
  { name: 'GitHub', provider: 'github' as const },
  { name: 'Apple', provider: 'apple' as const },
]

function ProviderIcon({ name }: { name: string }) {
  if (name === 'Google') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    )
  }
  if (name === 'GitHub') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    )
  }
  if (name === 'Apple') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74.82 0 2.1-.87 3.3-.74 1.9.15 3.17 1.38 3.4 2.8-.25 1.47-1.03 2.91-2.11 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    )
  }
  return null
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLDivElement>(null)
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

  const redirect = searchParams.get('redirect') || '/admin'

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShake(false)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setShake(true)
      setLoading(false)
      setTimeout(() => setShake(false), 500)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShake(false)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
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
    } else {
      setError('Check your email to verify your account!')
      setLoading(false)
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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setError('Magic link sent! Check your inbox.')
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')
    setResetSent(false)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login?reset=success`,
    })

    if (error) {
      setResetError(error.message)
    } else {
      setResetSent(true)
    }
    setResetLoading(false)
  }

  return (
    <div className="min-h-screen romantic-bg flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          ref={formRef}
          className={`bg-white rounded-2xl border border-stone-200 p-8 ${shake ? 'animate-shake' : ''}`}
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center hover:bg-sky-200 transition-colors">
                <Heart className="w-7 h-7 text-sky-600" />
              </div>
            </Link>
            <h1 className="font-script text-3xl text-sky-700 mb-2">
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-stone-500">
              {activeTab === 'signin'
                ? 'Sign in to your love letter dashboard'
                : 'Join your love letter dashboard'}
            </p>
          </div>

          <div className="flex mb-6 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('signin'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'signin'
                  ? 'bg-white dark:bg-stone-700 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'signup'
                  ? 'bg-white dark:bg-stone-700 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <motion.div
              className="p-4 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 text-sm mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-3 mb-6">
            <p className="text-center text-stone-400 text-sm">Or continue with</p>
            {OAUTH_PROVIDERS.map(({ name, provider }) => (
              <button
                key={provider}
                onClick={() => handleOAuth(provider)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                <span style={{ color: provider === 'google' ? '#EA4335' : provider === 'github' ? '#333' : '#000' }}>
                  <ProviderIcon name={name} />
                </span>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Continue with {name}
                </span>
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-stone-800 text-stone-400">or</span>
            </div>
          </div>

          {showReset ? (
            <form onSubmit={handleReset} className="space-y-4 mb-6">
              {resetSent ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Check your email for the reset link
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                      {resetError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input pl-12 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {resetLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : activeTab === 'signup' ? (
            <form onSubmit={handleSignUp} className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Name</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input pl-12 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-12 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-12 focus:ring-sky-500"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-12 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-12 focus:ring-sky-500"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/signup"
              className="text-sky-600 hover:text-sky-700 font-medium"
            >
              {activeTab === 'signin' ? 'Create account' : 'Already have an account? Sign in'}
            </Link>
            <button
              onClick={() => { setShowReset(!showReset); setError('') }}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={handleMagicLink}
              disabled={loading}
              className="text-sm text-stone-400 hover:text-sky-600 transition-colors"
            >
              Send magic link instead
            </button>
          </div>

          <p className="text-center text-stone-300 text-xs mt-4">
            Demo mode: any email/password works
          </p>
        </div>
      </motion.div>
    </div>
  )
}
