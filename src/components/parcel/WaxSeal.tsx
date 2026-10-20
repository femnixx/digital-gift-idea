'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface WaxSealProps {
  /** Monogram letter pressed into the seal */
  monogram?: string
  /** Whether the seal is cracked open */
  cracked?: boolean
  className?: string
  /** Accessible label */
  label?: string
  /** Size scale 0-1 */
  scale?: number
}

/**
 * Wax seal — raised, irregular edge, pressed monogram, highlight + cast shadow.
 * Cracks on open.
 */
export function WaxSeal({
  monogram = 'K',
  cracked = false,
  className = '',
  label = 'Wax seal',
  scale = 1,
}: WaxSealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <span
      className={`inline-block relative ${className}`}
      aria-label={label}
      style={{ transform: `scale(${scale})` }}
    >
      {/* Cast shadow offset top-left */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#1a140e]/35 blur-sm"
        style={{ top: '6px', left: '6px', zIndex: 0 }}
        animate={{ opacity: cracked ? 0.45 : 0.7 }}
        transition={{ duration: 0.4 }}
      />
      {/* Raised seal body */}
      <motion.div
        className="relative z-10 w-24 h-24 rounded-full border-4 border-[#5a171e] bg-[#7a1f2b] shadow-tactile-wax relative"
        animate={
          cracked
            ? { scale: 0.9, rotate: -3 }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          duration: reduceMotion ? 0 : 0.5,
          type: cracked ? 'spring' : 'spring',
          stiffness: cracked ? 260 : 220,
          damping: cracked ? 22 : 20,
        }}
      >
        {/* Highlight (top-left light source) */}
        <div className="absolute -inset-px rounded-full border-t-2 border-l-2 border-[#c9a84e]/40 pointer-events-none" />
        {/* Pressed monogram (debossed) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: 'rgba(43, 33, 24, 0.35)', fontSize: '1.5rem', fontWeight: '700' }}
        >
          {monogram}
        </div>
        {/* Deboss inset shadow */}
        <div className="absolute inset-0 rounded-full shadow-tactile-inset pointer-events-none" />
        {/* Crack lines */}
        {cracked && (
          <>
            <div
              className="absolute top-1/2 left-1/4 w-1/2 h-px bg-[#4a1016] transform -translate-y-1/2 rotate-45"
              style={{ transform: 'translate(-50%, -50%) rotate(4deg)' }}
            />
            <div
              className="absolute top-3/4 right-1/4 w-1/3 h-px bg-[#4a1016] transform -translate-y-1/2"
              style={{ transform: 'translate(-50%, -50%) rotate(-8deg)' }}
            />
            <div
              className="absolute top-1/4 right-1/5 w-px h-1/2 bg-[#4a1016] transform -translate-x-1/2"
              style={{ transform: 'translate(-50%, -50%) rotate(12deg)' }}
            />
          </>
        )}
      </motion.div>
    </span>
  )
}
