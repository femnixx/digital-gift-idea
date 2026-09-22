'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ensureProfileExists } from '@/lib/auth'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function verify() {
      try {
        const supabase = createClient()
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (token && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token,
            type,
            email: 'demo@loveletters.app',
          })

          if (error) {
            setStatus('error')
            setMessage(error.message)
          } else if (data.user) {
            await ensureProfileExists(data.user.id, (data.user as any).user_metadata?.display_name || data.user.email?.split('@')[0] || 'User')
            setStatus('success')
            setMessage('Your email has been verified! Redirecting...')
            setTimeout(() => {
              router.push('/admin')
              router.refresh()
            }, 2000)
          }
        } else {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error) {
            setStatus('error')
            setMessage(error.message)
          } else if (user) {
            await ensureProfileExists(user.id, user.user_metadata?.display_name || user.email?.split('@')[0] || 'User')
            setStatus('success')
            setMessage('Email verified! Redirecting...')
            setTimeout(() => {
              router.push('/admin')
              router.refresh()
            }, 2000)
          }
        }
      } catch {
        setStatus('error')
        setMessage('Verification failed. Please try again.')
      }
    }

    verify()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="bg-card rounded-2xl border-card-border p-8 max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-muted">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-muted">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
            <p className="text-muted mb-6">{message}</p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
