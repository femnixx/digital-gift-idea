'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center romantic-bg">
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 max-w-md text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="font-script text-2xl text-sky-700">Something went wrong</h1>
        <p className="text-stone-500 text-sm">{error.message || 'An unexpected error occurred.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">Try Again</button>
          <button onClick={handleSignOut} className="btn-secondary">Sign Out</button>
        </div>
      </div>
    </div>
  )
}
