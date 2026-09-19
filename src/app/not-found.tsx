'use client'

import { useState } from 'react'
import { Heart, Home, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  const [navigating, setNavigating] = useState(false)

  const handleNav = (e: React.MouseEvent) => {
    e.preventDefault()
    setNavigating(true)
    setTimeout(() => { window.location.href = '/' }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="card p-12 max-w-md text-center space-y-6">
        <div className="text-6xl">💌</div>
        <h1 className="heading">Page Not Found</h1>
        <p className="muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <button
          onClick={handleNav}
          disabled={navigating}
          className="btn-primary inline-flex items-center gap-2"
        >
          {navigating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Home className="w-4 h-4" />
          )}
          {navigating ? 'Going home...' : 'Back Home'}
        </button>
      </div>
    </div>
  )
}
