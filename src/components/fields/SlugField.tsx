'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SlugFieldProps {
  value: string
  onChange: (value: string) => void
  prefix?: string
  label?: string
  helper?: string
  error?: string
  onCheckAvailability?: (slug: string) => Promise<'available' | 'taken' | 'reserved'>
  suggestions?: string[]
}

export function SlugField({
  value,
  onChange,
  prefix = '/g/',
  label,
  helper,
  error,
  onCheckAvailability,
  suggestions,
}: SlugFieldProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'reserved'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanSlug = useCallback((v: string) => {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!onCheckAvailability || !value.trim()) {
      setStatus('idle')
      return
    }
    setStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await onCheckAvailability(cleanSlug(value))
        setStatus(result)
      } catch {
        setStatus('idle')
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, onCheckAvailability, cleanSlug])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanSlug(e.target.value)
    onChange(cleaned)
  }, [cleanSlug, onChange])

  const statusLabels: Record<string, { text: string; color: string }> = {
    idle: { text: '', color: 'text-text-muted' },
    checking: { text: 'checking…', color: 'text-text-muted' },
    available: { text: 'available', color: 'text-success' },
    taken: { text: 'taken', color: 'text-danger' },
    reserved: { text: 'reserved', color: 'text-danger' },
  }

  const statusInfo = statusLabels[status]

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted">
          keepsake.love{prefix}
        </span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          autoComplete="off"
          spellCheck={false}
          className={`pl-20 pr-4 py-3 font-mono text-sm text-text bg-surface border border-line rounded-[4px] focus:outline-none focus:ring-0 transition-colors ${
            status === 'taken' || status === 'reserved'
              ? 'border-danger'
              : status === 'available'
                ? 'border-success'
                : ''
          }`}
          placeholder="auto-generated"
        />
        {status !== 'idle' && status !== 'checking' && (
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}
          >
            {statusInfo.text}
          </span>
        )}
      </div>
      {error && (
        <span className="flex items-center gap-1 font-mono text-xs text-danger">
          <span aria-hidden="true">!</span> {error}
        </span>
      )}
      {!error && helper && (
        <span className="font-mono text-xs text-text-muted">{helper}</span>
      )}
      {status === 'taken' && suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="font-mono text-xs text-text-muted">Try:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="font-mono text-xs text-accent-text underline underline-offset-2 hover:text-accent bg-transparent border-none p-0 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
