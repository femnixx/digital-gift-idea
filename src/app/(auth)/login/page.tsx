'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className=""min-h-screen bg-cream-50 flex items-center justify-center p-6"">
      <motion.div
        className=""w-full max-w-md""
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className=""card p-8"">
          <div className=""text-center mb-8"">
            <Link href=""/"" className=""inline-flex items-center gap-2 mb-6"">
              <div className=""w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-lavender-500 flex items-center justify-center"">
                <Heart className=""w-7 h-7 text-white"" />
              </div>
            </Link>
            <h1 className=""font-script text-3xl gradient-text mb-2"">Welcome Back</h1>
            <p className=""text-rose-500"">Sign in to your love letter dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className=""space-y-6"">
            {error && (
              <motion.div
                className=""p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm""
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className=""label"">Email</label>
              <div className=""relative"">
                <Mail className=""absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400"" />
                <input
                  type=""email""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""you@example.com""
                  className=""input pl-12""
                  required
                />
              </div>
            </div>

            <div>
              <label className=""label"">Password</label>
              <div className=""relative"">
                <Lock className=""absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400"" />
                <input
                  type=""password""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""••••••••""
                  className=""input pl-12""
                  required
                />
              </div>
            </div>

            <button
              type=""submit""
              disabled={loading}
              className=""btn-primary w-full""
            >
              {loading ? (
                <motion.div
                  className=""w-5 h-5 border-2 border-white/30 border-t-white rounded-full""
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  Sign In
                  <ArrowRight className=""w-5 h-5"" />
                </>
              )}
            </button>
          </form>

          <p className=""text-center text-rose-400 text-sm mt-6"">
            Demo mode: any email/password works ✨
          </p>
        </div>
      </motion.div>
    </div>
  )
}