'use client'

import { useId } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  helper?: string
  error?: string
  disabled?: boolean
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  helper,
  error,
  disabled,
}: ToggleSwitchProps) {
  const id = useId()

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="font-ui text-sm font-medium text-text cursor-pointer select-none"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex w-12 h-6 shrink-0 cursor-pointer rounded-full border border-line transition-colors ${
          checked
            ? 'bg-accent border-accent'
            : 'bg-surface border-line'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow-btn transform transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {error && (
        <span className="font-mono text-xs text-danger">
          {error}
        </span>
      )}
      {!error && helper && (
        <span className="font-mono text-xs text-text-muted">{helper}</span>
      )}
    </div>
  )
}
