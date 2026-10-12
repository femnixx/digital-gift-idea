'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { setUserName } from '@/lib/userIdentity'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setNameField] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create account')

      setUserName(data.user?.name || data.user?.email || '')
      router.push('/create')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="section flex items-center justify-center">
      <div className="container max-w-md">
        <div className="card p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-base-2 flex items-center justify-center">
              <Heart className="w-6 h-6 text-stone-700 dark:text-stone-300" />
            </div>
            <h1 className="heading">Create your account</h1>
            <p className="muted-foreground mt-2 text-sm">It is free, and nobody approves it but you</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-base border border-base focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name <span className="muted-foreground">(optional)</span></label>
              <input
                id="name" type="text" value={name}
                onChange={(e) => setNameField(e.target.value)}
                placeholder="What should we call you?"
                className="w-full px-3 py-2 rounded-xl bg-base border border-base focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-base border border-base focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
                <button
                  type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm muted-foreground">
            Already have an account? <a href="/login" className="underline">Sign in</a>
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}
