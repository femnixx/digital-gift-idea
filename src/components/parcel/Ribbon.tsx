'use client'

import { useCallback, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface RibbonProps {
  /** Whether the ribbon is currently tied */
  tied?: boolean
  /** On untie completion */
  onUntie?: () => void
  className?: string
  color?: 'oxblood' | 'forest' | 'brass'
}

/**
 * Ribbon — woven texture, drapes over the parcel, untied by dragging.
 * Has a keyboard alternative (Enter/Space) for accessibility.
 */
export function Ribbon({
  tied = true,
  onUntie,
  className = '',
  color = 'oxblood',
}: RibbonProps) {
  const reduceMotion = useReducedMotion()
  const [dragging, setDragging] = useState(false)
  const [untied, setUntied] = useState(!tied)
  const dragRef = useRef<HTMLDivElement>(null)

  const COLORS: Record<string, string> = {
    oxblood: '#7A1F2B',
    forest: '#2F4A3A',
    brass: '#B08A3E',
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !untied) {
        e.preventDefault()
        setUntied(true)
        onUntie?.()
      }
    },
    [untied, onUntie]
  )

  const handleDragEnd = useCallback(() => {
    setDragging(false)
    setUntied(true)
    onUntie?.()
  }, [onUntie])

  if (untied) {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={{ x: '-120%' }}
        animate={{ x: 0 }}
        exit={{ x: '120%' }}
        transition={{
          duration: reduceMotion ? 0 : 0.5,
          type: 'spring',
          stiffness: 220,
          damping: 20,
        }}
      />
    )
  }

  return (
    <div
      ref={dragRef}
      className={`relative cursor-grab active:cursor-grabbing ${className}`}
      role="button"
      tabIndex={0}
      aria-label={tied ? 'Untie ribbon' : 'Ribbon untied'}
      aria-pressed={dragging}
      onKeyDown={handleKeyDown}
      onPointerDown={() => setDragging(true)}
      onPointerUp={handleDragEnd}
      onPointerLeave={handleDragEnd}
      onPointerMove={(e) => {
        if (!dragging || reduceMotion) return
        const el = dragRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        el.style.transform = `translateX(${Math.max(0, Math.min(x, 40))}px)`
      }}
    >
      {/* Ribbon body (woven texture via mask) */}
      <motion.div
        className="absolute inset-x-0 top-0 bottom-0 overflow-hidden"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: dragging ? 0.55 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 45%, transparent 55%, transparent 100%)',
            backgroundSize: '200% 100%',
            maskImage:
              'linear-gradient(to bottom, #000 60%, transparent 100%)',
            backgroundColor: COLORS[color],
          }}
        />
      </motion.div>

      {/* Bow / knot center */}
      <motion.div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        style={{ width: '28px', height: '28px', background: COLORS[color], borderRadius: '50%' }}
        animate={{ scale: dragging ? 0.85 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {/* Knot highlight */}
        <div className="absolute -inset-1 rounded-full border-t-2 border-l-2 border-[#c9a84e]/50" />
      </motion.div>

      {/* Dragging affordance: small tab */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded bg-[#c9a84e] shadow-tactile-card" />

      <span className="sr-only">
        {tied ? 'Drag or press Enter to untie the ribbon' : 'Ribbon untied'}
      </span>
    </div>
  )
}
