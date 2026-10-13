'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Global error boundary, shown when any route throws.
 *
 * It used to offer an admin sign-out, which made no sense for a public
 * visitor: gifts are created anonymously, so there is no session to end, and
 * the button only sent people to the admin login screen. It now offers the two
 * actions that actually help: retry, or go back to the landing page.
 *
 * The literal admin paths are deliberately absent from this file so the
 * guardrail test can assert on them directly.
 */
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-6">
      <div className="card p-8 max-w-md text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="heading">Something went wrong</h1>
        <p className="muted-foreground text-sm">{error.message || 'An unexpected error occurred.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">Try Again</button>
          <button onClick={() => router.push('/')} className="btn-secondary">Go Home</button>
        </div>
      </div>
    </div>
  )
}
