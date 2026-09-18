'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Mail, Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle, User, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

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
    } else if (data.user && !data.user.confirmed_at) {
      setSuccess(true)
    } else {
      router.push(redirect)
      router.refresh()
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
      <div className="min-h-screen romantic-bg flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-sky-600 mx-auto mb-4" />
            <h1 className="font-script text-3xl text-sky-700 mb-2">Check Your Email</h1>
            <p className="text-stone-500 mb-2">We sent a verification link to {email}</p>
            <p className="text-stone-400 text-sm">Click the link to verify your account and start creating love letters.</p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 mt-6">
              <ArrowRight className="w-4 h-4" />
              Go to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen romantic-bg flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className={`bg-white rounded-2xl border border-stone-200 p-8 ${shake ? 'animate-shake' : ''}`}
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center hover:bg-sky-200 transition-colors">
                <Heart className="w-7 h-7 text-sky-600" />
              </div>
            </Link>
            <h1 className="font-script text-3xl text-sky-700 mb-2">Create Account</h1>
            <p className="text-stone-500">Join your love letter dashboard</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="mt-6">
            <p className="text-center text-stone-400 text-sm mb-3">Or sign up with</p>
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
                  className="flex items-center justify-center gap-2 py-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm capitalize text-stone-600 dark:text-stone-400">{name}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-stone-300 text-xs mt-6">
            Demo mode: any email/password works
          </p>
        </div>
      </motion.div>
    </div>
  )
}
