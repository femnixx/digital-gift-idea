'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SkyDialProps {
  value: string // ISO datetime string
  onChange: (value: string) => void
  label?: string
  helper?: string
  error?: string
}

export function SkyDial({ value, onChange, label, helper, error }: SkyDialProps) {
  const [hour, setHour] = useState<number>(new Date().getHours())
  const [dayOffset, setDayOffset] = useState<number>(0)
  const dialRef = useRef<HTMLDivElement>(null)
  const sunRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dt = new Date(value)
    if (!isNaN(dt.getTime())) {
      setHour(dt.getHours())
      setDayOffset(Math.round((dt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    }
  }, [value])

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dialRef.current || !sunRef.current) return
    const rect = dialRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = clientX - centerX
    const dy = clientY - centerY
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    if (angle < 0) angle += 360

    // Map angle to hour: 6am at left (180deg), noon at top (90deg), 6pm at right (0deg)
    // Night arc: 6pm to 6am (moon)
    let newHour: number
    if (angle >= 90 && angle <= 270) {
      // Day arc: 6am to 6pm going over top
      newHour = 6 + ((270 - angle) / 180) * 12
    } else {
      // Night arc
      newHour = 18 + ((angle < 90 ? angle + 360 : angle) - 270) / 180 * 12
      if (newHour >= 24) newHour -= 24
    }
    setHour(Math.round(newHour))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent) => handleDrag(ev)
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    handleDrag(e.nativeEvent)
  }, [handleDrag])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const move = (ev: TouchEvent) => handleDrag(ev)
    const up = () => {
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
    window.addEventListener('touchmove', move)
    window.addEventListener('touchend', up)
    handleDrag(e.nativeEvent)
  }, [handleDrag])

  const handleTimeInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map(Number)
    if (h != null) setHour(h)
  }, [])

  const computeDateTime = useCallback(() => {
    const now = new Date()
    const dt = new Date(now)
    dt.setDate(now.getDate() + dayOffset)
    dt.setHours(hour, 0, 0, 0)
    return dt.toISOString()
  }, [hour, dayOffset])

  useEffect(() => {
    onChange(computeDateTime())
  }, [computeDateTime, onChange])

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const dt = new Date(computeDateTime())
  const diffDays = Math.round((dt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-4">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      <div className="relative">
        <div
          ref={dialRef}
          className="relative w-48 h-24 mx-auto overflow-hidden"
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 200 100"
          >
            <path
              d="M 10 90 Q 100 10 190 90"
              fill="none"
              stroke="rgb(var(--line))"
              strokeWidth="2"
            />
            <path
              d="M 100 10 Q 100 100 100 10"
              fill="none"
              stroke="rgb(var(--line) / 0.3)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <circle
              cx="10" cy="90" r="6"
              fill="rgb(var(--accent))"
            />
            <circle
              cx="190" cy="90" r="6"
              fill="rgb(var(--ink))"
              opacity="0.4"
            />
          </svg>
          <div
            ref={sunRef}
            className="absolute w-6 h-6 rounded-full bg-accent shadow-btn border border-ink"
            style={{
              left: 'calc(50% - 12px)',
              top: 'calc(50% - 12px)',
              transform: `translate(-50%, -50%) rotate(${hour * 15}deg) translate(0, -40px) rotate(${-hour * 15}deg)`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            role="slider"
            aria-label="Hour"
            aria-valuemin={0}
            aria-valuemax={23}
            aria-valuenow={hour}
            tabIndex={0}
          />
        </div>
        <input
          type="time"
          value={new Date(computeDateTime()).toISOString().slice(11, 16)}
          onChange={handleTimeInput}
          className="mt-4 font-mono text-sm text-text bg-surface border border-line rounded-[4px] px-3 py-2 focus:outline-none focus:ring-0"
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-text-muted">Timezone: {timezone}</span>
        <span
          className={`font-mono text-xs font-medium ${
            diffDays <= 0 ? 'text-danger' : 'text-success'
          }`}
        >
          {diffDays > 0 ? `opens in ${diffDays} days` : 'available now'}
        </span>
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
