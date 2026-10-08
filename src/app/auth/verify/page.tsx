'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }, [router])

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="bg-card rounded-2xl border-card-border p-8 max-w-md text-center">
        <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
        <p className="text-muted">Redirecting to sign in...</p>
      </div>
    </div>
  )
}
