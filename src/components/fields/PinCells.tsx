'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface PinCellsProps {
  length: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  label?: string
  helper?: string
  error?: string
  alphanumeric?: boolean
}

export function PinCells({
  length = 6,
  value,
  onChange,
  onComplete,
  label,
  helper,
  error,
  alphanumeric = false,
}: PinCellsProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const [cells, setCells] = useState<Array<{ value: string; error: boolean }>>(
    Array.from({ length }, () => ({ value: '', error: false }))
  )

  useEffect(() => {
    const cellValues = value.split('').map((v) => ({ value: v, error: false }))
    while (cellValues.length < length) cellValues.push({ value: '', error: false })
    setCells(cellValues.slice(0, length))
  }, [value, length])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const input = e.target
      let raw = input.value
      if (!alphanumeric) raw = raw.replace(/[^0-9]/g, '')
      else raw = raw.replace(/[^a-z0-9]/gi, '')
      raw = raw.slice(0, 1)

      setCells((prev) => {
        const next = [...prev]
        next[index] = { value: raw, error: false }
        return next
      })

      const joined = cells.map((c, i) => (i === index ? raw : c.value)).join('')
      onChange(joined)

      if (raw && index < length - 1) {
        inputsRef.current[index + 1]?.focus()
      } else if (!raw && index > 0) {
        inputsRef.current[index - 1]?.focus()
      }

      if (joined.length === length) {
        onComplete?.(joined)
      }
    },
    [cells, length, onChange, onComplete, alphanumeric]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault()
      const pasteData = e.clipboardData?.getData('text') || ''
      const cleaned = alphanumeric
        ? pasteData.replace(/[^a-z0-9]/gi, '')
        : pasteData.replace(/[^0-9]/g, '')

      setCells((prev) => {
        const next = [...prev]
        for (let i = 0; i < length && index + i < length; i++) {
          next[index + i] = { value: cleaned[i] || '', error: false }
        }
        return next
      })

      const allFilled = cells
        .map((c, i) => (i >= index && i < index + cleaned.length ? cleaned[i - index] : c.value))
        .join('')
        .replace(/\s/g, '')
      const full = cells
        .map((c, i) => (i >= index && i < index + cleaned.length ? cleaned[i - index] : c.value))
        .join('')
      onChange(full)

      const nextFocus = Math.min(index + cleaned.length, length - 1)
      inputsRef.current[nextFocus]?.focus()

      if (full.length === length) {
        onComplete?.(full)
      }
    },
    [cells, length, onChange, onComplete, alphanumeric]
  )

  const handleBackspace = useCallback(
    (index: number) => {
      setCells((prev) => {
        const next = [...prev]
        next[index] = { value: '', error: false }
        return next
      })
      const prev = [...cells]
      prev[index] = { value: '', error: false }
      onChange(prev.map((c) => c.value).join(''))
      inputsRef.current[index - 1]?.focus()
    },
    [cells, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && e.currentTarget.value === '') {
        e.preventDefault()
        handleBackspace(index)
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault()
        inputsRef.current[index - 1]?.focus()
      }
      if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault()
        inputsRef.current[index + 1]?.focus()
      }
    },
    [length, handleBackspace]
  )

  const shake = useCallback(() => {
    setCells((prev) => prev.map((c) => ({ ...c, error: true })))
    setTimeout(() => {
      setCells((prev) => prev.map((c) => ({ ...c, error: false })))
      setCells((prev) => prev.map((c) => ({ ...c, value: '' })))
      onChange('')
    }, 400)
  }, [onChange])

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      <div
        role="textbox"
        aria-label={label || 'PIN code'}
        className="flex gap-2"
      >
        {cells.map((cell, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el
            }}
            type="text"
            maxLength={1}
            value={cell.value}
            onChange={(e) => handleInput(e, i)}
            onPaste={(e) => handlePaste(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            inputMode={alphanumeric ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            className={`w-10 h-12 flex-shrink-0 border border-line rounded-[4px] text-center font-mono text-lg font-medium text-text bg-surface transition-all ${
              cell.error
                ? 'border-danger text-danger bg-danger/10 animate-[shake_0.4s_cubic-bezier(.36,.07,.19,.97)_both]'
                : ''
            } ${i === cells.findIndex((c) => c.value === '' && i === cells.length - 1 ? -1 : 0) ? '' : ''}`}
          />
        ))}
      </div>
      {error && (
        <span className="flex items-center gap-1 font-mono text-xs text-danger">
          <span aria-hidden="true">!</span> {error}
        </span>
      )}
      {!error && helper && (
        <span className="font-mono text-xs text-text-muted">{helper}</span>
      )}
    </div>
  )
}
