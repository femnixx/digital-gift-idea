'use client'

import { useState } from 'react'
import { FlaskConical, X, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const isDemoMode = !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  )

  if (!isDemoMode) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-card border border-base flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Demo Mode Active</p>
            <p className="muted-foreground text-xs mt-1">
              Running with localStorage fallback. Data persists in your browser.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                href="/daily/2026-09-15"
                className="btn-primary inline-flex items-center justify-center px-3 py-1.5 text-xs"
              >
                Try Demo Entry
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="accent hover:opacity-80 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="muted hover:opacity-80 flex-shrink-0"
            aria-label="Dismiss demo banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-base flex items-center gap-2 muted-foreground text-xs">
          <Heart className="w-3 h-3 accent" />
          <span>Made with love for testing</span>
        </div>
      </div>
    </div>
  )
}
