'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical, X, Heart, Sparkles, ArrowRight } from 'lucide-react'
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
    >
      <div className="card p-4 shadow-2xl border-rose-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-lavender-500 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-rose-900 text-sm">Demo Mode Active 🧪</p>
            <p className="text-rose-600 text-xs mt-1">
              Running with localStorage fallback. Data persists in your browser.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                href="/daily/2026-09-15"
                className="btn-primary text-xs px-3 py-1.5 group"
              >
                Try Demo Entry
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="text-rose-400 hover:text-rose-600 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-rose-300 hover:text-rose-500 flex-shrink-0"
            aria-label="Dismiss demo banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-rose-100 flex items-center gap-2 text-rose-500 text-xs">
          <Heart className="w-3 h-3 animate-heartbeat" />
          <span>Made with love for testing</span>
          <Sparkles className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  )
}