'use client'

import { useCallback, useState } from 'react'

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  helper?: string
  error?: string
  placeholder?: string
  maxChips?: number
}

export function ChipInput({
  value,
  onChange,
  label,
  helper,
  error,
  placeholder = 'Type and press Enter',
  maxChips,
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const chips = value

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (maxChips && chips.length >= maxChips) return
    onChange([...chips, trimmed])
    setInputValue('')
  }, [inputValue, chips, maxChips, onChange])

  const handleRemove = useCallback((index: number) => {
    onChange(chips.filter((_, i) => i !== index))
  }, [chips, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAdd()
      }
      if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
        e.preventDefault()
        onChange(chips.slice(0, -1))
      }
      if (e.altKey && e.key === 'ArrowLeft' && dragIndex !== null && dragIndex > 0) {
        e.preventDefault()
        const next = [...chips]
        ;[next[dragIndex], next[dragIndex - 1]] = [next[dragIndex - 1], next[dragIndex]]
        onChange(next)
        setDragIndex(dragIndex - 1)
      }
      if (e.altKey && e.key === 'ArrowRight' && dragIndex !== null && dragIndex < chips.length - 1) {
        e.preventDefault()
        const next = [...chips]
        ;[next[dragIndex], next[dragIndex + 1]] = [next[dragIndex + 1], next[dragIndex]]
        onChange(next)
        setDragIndex(dragIndex + 1)
      }
    },
    [inputValue, chips, dragIndex, maxChips, onChange, handleAdd]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text')
      const newChips = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      if (newChips.length === 0) return
      const combined = [...chips, ...newChips]
      const limited = maxChips ? combined.slice(0, maxChips) : combined
      onChange(limited)
    },
    [chips, maxChips, onChange]
  )

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      <div
        role="textbox"
        aria-multiline="true"
        className={`flex flex-wrap gap-2 border border-line rounded-[4px] bg-surface p-2 min-h-[44px] focus-within:border-accent focus-within:shadow-btn transition-colors`}
      >
        {chips.map((chip, i) => (
          <span
            key={i}
            draggable
            onDragStart={(e) => {
              setDragIndex(i)
              e.dataTransfer.setData('text/plain', String(i))
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const from = Number(e.dataTransfer.getData('text/plain'))
              if (from === i || from < 0 || from >= chips.length) return
              const next = [...chips]
              const [removed] = next.splice(from, 1)
              next.splice(i, 0, removed)
              onChange(next)
              setDragIndex(i)
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-accent-soft border border-accent text-accent-text font-mono text-xs font-medium shadow-btn ${
              dragIndex === i ? 'opacity-50' : ''
            }`}
          >
            {chip}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(i)
              }}
              className="p-0 text-text-muted hover:text-danger"
              aria-label={`Remove ${chip}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 font-mono text-sm text-text bg-transparent border-none outline-none px-2 py-1.5"
        />
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
