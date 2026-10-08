'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }, [router])

  return (
    <div className="min-h-screen romantic-bg flex items-center justify-center p-6">
      <div className="text-center">
        <Heart className="w-12 h-12 text-sky-600 mx-auto mb-4 animate-pulse" />
        <p className="text-stone-500">Redirecting...</p>
      </div>
    </div>
  )
}
