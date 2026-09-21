'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ensureProfileExists } from '@/lib/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          setError(sessionError.message)
        } else if (session) {
          await ensureProfileExists(session.user.id, session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User')
          const redirectTo = searchParams.get('redirect') || '/admin'
          router.push(redirectTo)
          router.refresh()
        } else {
          setError('No session found. Please try signing in again.')
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed')
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="text-center">
          <Heart className="w-12 h-12 accent mx-auto mb-4 animate-pulse" />
          <p className="muted-foreground">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="card p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="heading mb-2">Authentication Error</h1>
          <p className="muted-foreground mb-6">{error}</p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return null
}
