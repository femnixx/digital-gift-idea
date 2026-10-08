'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="card p-8 max-w-md text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="heading">Something went wrong</h1>
        <p className="muted-foreground text-sm">{error.message || 'An unexpected error occurred.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">Try Again</button>
          <button onClick={handleSignOut} className="btn-secondary">Sign Out</button>
        </div>
      </div>
    </div>
  )
}
