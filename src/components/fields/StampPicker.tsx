'use client'

import { useCallback, useState } from 'react'

interface StampPickerProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  label?: string
  error?: string
}

export function StampPicker<T extends string>({
  options,
  value,
  onChange,
  label,
  error,
}: StampPickerProps<T>) {
  const [pressed, setPressed] = useState<T | null>(null)

  const handleSelect = useCallback(
    (v: T) => {
      setPressed(v)
      setTimeout(() => setPressed(null), 150)
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
        aria-label={label || 'Select'}
        className="grid gap-2"
      >
        {options.map((opt) => {
          const active = value === opt.value
          const isPressed = pressed === opt.value
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`flex items-center justify-between gap-2 border border-line rounded-[4px] bg-surface px-4 py-3 text-sm font-mono font-medium text-text transition-all ${
                active
                  ? 'border-accent bg-accent-soft shadow-btn'
                  : ''
              } ${isPressed ? 'transform scale-[0.97]' : ''}`}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] opacity-50">
                {active ? 'selected' : ''}
              </span>
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
