'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
    <motion.div
      className="fixed bottom-4 right-4 z-50 max-w-sm"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">Demo Mode Active</p>
            <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
              Running with localStorage fallback. Data persists in your browser.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                href="/daily/2026-09-15"
                className="inline-flex items-center justify-center px-3 py-1.5 bg-sky-600 text-white text-xs rounded-lg hover:bg-sky-700 transition-colors"
              >
                Try Demo Entry
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="text-sky-500 hover:text-sky-700 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-stone-400 hover:text-stone-600 flex-shrink-0"
            aria-label="Dismiss demo banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs">
          <Heart className="w-3 h-3 text-sky-500" />
          <span>Made with love for testing</span>
        </div>
      </div>
    </motion.div>
  )
}
