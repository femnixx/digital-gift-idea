'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface RulerSliderProps {
  value: number
  min: number
  max: number
  step: number
  label: string
  unit?: string
  onChange: (value: number) => void
  error?: string
  helper?: string
}

export function RulerSlider({
  value,
  min,
  max,
  step,
  label,
  unit,
  onChange,
  error,
  helper,
}: RulerSliderProps) {
  const ticks = Math.round((max - min) / step)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const tickSpacing = 100 / ticks

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const pos = (clientX - rect.left) / rect.width
      const clamped = Math.max(0, Math.min(1, pos))
      const raw = min + clamped * (max - min)
      const snapped = Math.round((raw - min) / step) * step + min
      setDragging(true)
      onChange(snapped)
    },
    [min, max, step, onChange]
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent) => handleDrag(ev)
    const up = () => {
      setDragging(false)
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
      setDragging(false)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
    window.addEventListener('touchmove', move)
    window.addEventListener('touchend', up)
    handleDrag(e.nativeEvent)
  }, [handleDrag])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onChange(Math.max(min, value - step))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onChange(Math.min(max, value + step))
      }
    },
    [value, min, max, step, onChange]
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline gap-2">
        <label className="font-ui text-sm font-medium text-text">{label}</label>
        <span
          className={`font-mono text-lg font-bold text-text ${error ? 'text-danger' : ''}`}
        >
          {value}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div
        ref={containerRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`relative h-12 flex items-end gap-1 px-4 cursor-pointer rounded-[4px] border border-line bg-surface ${
          dragging ? 'ring-2 ring-accent-text' : ''
        }`}
      >
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const tickVal = min + i * step
          const isMajor = i % 5 === 0
          const isActive = tickVal === value
          return (
            <div
              key={i}
              style={{
                left: `${i * tickSpacing}%`,
              }}
              className={`absolute -bottom-1 w-[1px] transition-all ${
                isMajor
                  ? 'bg-text-soft h-4'
                  : 'bg-text-muted h-2'
              } ${isActive ? 'w-2 bg-accent z-10' : ''}`}
            />
          )
        })}
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
