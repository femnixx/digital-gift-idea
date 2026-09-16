'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Trash2, RotateCcw, Sparkles, Check, AlertTriangle, FlaskConical } from 'lucide-react'

export function DemoDataManager() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  
  const isDemoMode = !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  )
  
  if (!isDemoMode) return null

  const handleReseed = () => {
    setStatus('loading')
    setMessage('Reseeding demo data...')
    
    // Clear and reseed
    localStorage.removeItem('digital-love-letters-demo')
    
    // Trigger the initializer
    window.location.reload()
  }

  const handleClear = () => {
    if (!confirm('Clear all demo data? This cannot be undone.')) return
    
    setStatus('loading')
    setMessage('Clearing demo data...')
    
    localStorage.removeItem('digital-love-letters-demo')
    
    setTimeout(() => {
      setStatus('success')
      setMessage('Demo data cleared! Refresh to reseed.')
    }, 500)
  }

  return (
    <motion.div
      className="card p-6 border-rose-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h3 className="font-semibold text-rose-900">Demo Mode Tools</h3>
          <p className="text-rose-500 text-sm">Manage localStorage demo data</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleReseed}
          disabled={status === 'loading'}
          className="btn-secondary flex items-center gap-2"
        >
          <RotateCcw className={status === 'loading' ? 'animate-spin' : ''} />
          Reseed Demo Data
        </button>
        
        <button
          onClick={handleClear}
          disabled={status === 'loading'}
          className="btn flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </button>
      </div>
      
      {message && (
        <motion.p
          className={`mt-4 text-sm flex items-center gap-2 ${
            status === 'success' ? 'text-green-600' :
            status === 'error' ? 'text-rose-600' :
            'text-rose-600'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {status === 'success' && <Check className="w-4 h-4" />}
          {status === 'error' && <AlertTriangle className="w-4 h-4" />}
          {status === 'loading' && <RotateCcw className="w-4 h-4 animate-spin" />}
          {message}
        </motion.p>
      )}
      
      <div className="mt-4 pt-4 border-t border-rose-100">
        <p className="text-rose-500 text-xs">
          <Sparkles className="w-3 h-3 inline" /> 
          Data stored in localStorage: <code>digital-love-letters-demo</code>
        </p>
      </div>
    </motion.div>
  )
}