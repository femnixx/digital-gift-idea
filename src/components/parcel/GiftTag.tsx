'use client'

import { motion } from 'framer-motion'

interface GiftTagProps {
  /** Short text on the tag (e.g. "For You", a name, a date) */
  text?: string
  /** Whether to animate the sway */
  sway?: boolean
  className?: string
  label?: string
}

/**
 * Gift tag — hole + string, hangs and sways slightly on hover.
 */
export function GiftTag({
  text = 'For You',
  sway = true,
  className = '',
  label = 'Gift tag',
}: GiftTagProps) {
  return (
    <span
      className={`inline-block relative ${className}`}
      aria-label={label}
    >
      {/* String hanging from above */}
      <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 w-px h-6 bg-[#5a4a3b]/60" />

      <motion.div
        whileHover={{ rotate: 6 }}
        whileTap={{ rotate: -2 }}
        animate={sway ? { rotate: [0, 3, 0] } : {}}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 18,
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative -top-1 px-2 py-1.5 bg-[#FBF6EA] border border-[#5a4a3b]/30 rounded-sm shadow-tactile-card"
        style={{
          transformOrigin: 'top center',
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
          color: '#2B2118',
        }}
      >
        {/* Hole punch */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#2B2118]/40"
        />
        {text}
      </motion.div>
    </span>
  )
}
