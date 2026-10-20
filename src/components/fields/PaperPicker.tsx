'use client'

import { useCallback, useState } from 'react'

interface PaperPickerProps {
  options: Array<{ value: string; label: string; description?: string }>
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
}

export function PaperPicker({
  options,
  value,
  onChange,
  label,
  error,
}: PaperPickerProps) {
  const [lifted, setLifted] = useState<string | null>(null)

  const handleSelect = useCallback(
    (v: string) => {
      setLifted(v)
      setTimeout(() => setLifted(null), 200)
      onChange(v)
    },
    [onChange]
  )

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      <div
        role="radiogroup"
        aria-label={label || 'Paper stock'}
        className="grid gap-3"
      >
        {options.map((opt) => {
          const active = value === opt.value
          const isLifted = lifted === opt.value
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`relative flex flex-col items-start gap-1 border border-line rounded-[4px] bg-surface p-4 transition-all ${
                active
                  ? 'border-accent bg-accent-soft shadow-btn'
                  : ''
              } ${isLifted ? 'translate-y-[-4px]' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-sm border border-ink bg-paper-deep flex-shrink-0"
                />
                <span className="font-ui text-sm font-medium text-text">
                  {opt.label}
                </span>
              </div>
              {opt.description && (
                <span className="font-mono text-xs text-text-muted">
                  {opt.description}
                </span>
              )}
              {active && (
                <span className="mt-1 w-2 h-2 rounded-full bg-accent shadow-btn" />
              )}
            </button>
          )
        })}
      </div>
      {error && (
        <span className="flex items-center gap-1 font-mono text-xs text-danger">
          <span aria-hidden="true">!</span> {error}
        </span>
      )}
    </div>
  )
}
