'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface LinedTextareaProps {
  value: string
  onChange: (value: string) => void
  label?: string
  helper?: string
  error?: string
  maxLength?: number
  lineHeight?: number
}

export function LinedTextarea({
  value,
  onChange,
  label,
  helper,
  error,
  maxLength,
  lineHeight = 24,
}: LinedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    setWordCount(value.trim() ? value.trim().split(/\s+/).length : 0)
  }, [value])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement
    const textarea = target.querySelector('textarea')
    const lineNumbers = target.querySelector('.line-numbers')
    if (textarea && lineNumbers) {
      ;(lineNumbers as HTMLElement).style.transform = `translateY(-${textarea.scrollTop}px)`
    }
  }, [])

  const readingTime = Math.ceil(wordCount / 200)

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      <div
        className="relative group"
        onScroll={handleScroll}
      >
        <div className="absolute left-0 top-0 bottom-0 w-4 text-right pointer-events-none select-none">
          <span className="font-mono text-[11px] text-text-muted block h-[24px]">1</span>
          {Array.from({ length: Math.ceil(value.length / 60) }, (_, i) => (
            <span
              key={i}
              className="font-mono text-[11px] text-text-muted block h-[24px]"
              style={{ marginTop: i * lineHeight }}
            >
              {i + 2}
            </span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full font-mono text-sm text-text bg-surface border border-line rounded-[4px] pl-8 pr-4 py-3 focus:outline-none focus:ring-0 resize-none"
          style={{
            lineHeight: `${lineHeight}px`,
            paddingTop: '8px',
            paddingBottom: '8px',
          }}
          maxLength={maxLength}
          spellCheck={false}
        />
      </div>
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-text-muted">
            {wordCount} words
          </span>
          <span className="font-mono text-xs text-text-muted">
            ~{readingTime} min read
          </span>
        </div>
        {maxLength && (
          <span
            className={`font-mono text-xs font-medium ${value.length > maxLength * 0.9 ? 'text-danger' : 'text-text-muted'}`}
          >
            {value.length} / {maxLength}
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
    </div>
  )
}
