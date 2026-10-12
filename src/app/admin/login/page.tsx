'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function AdminLoginPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const redirect = searchParams.get('redirect') || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      window.location.assign(redirect)
    } catch (err: any) {
      setError(err.message)
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
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-lg bg-card border border-base flex items-center justify-center">
                <Heart className="w-7 h-7 accent" />
              </div>
            </div>
            <h1 className="heading mb-2">Admin Login</h1>
            <p className="muted-foreground">Enter credentials to access the dashboard</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg text-sm mb-6 border border-card-border bg-card/80 text-accent animate-fade-in-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 muted" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-card-border bg-base/50 text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-card-border bg-base/50 text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-sm muted-foreground">
            <p>Authorized personnel only</p>
          </div>
        </div>
      </div>
    </div>
  )
}