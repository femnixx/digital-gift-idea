'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { WaxSeal } from '@/components/parcel/WaxSeal'
import { Ribbon } from '@/components/parcel/Ribbon'
import { GiftTag } from '@/components/parcel/GiftTag'

interface ParcelProps {
  /** Whether the parcel lid is open */
  open?: boolean
  /** Whether ribbon is tied */
  ribbonTied?: boolean
  /** Whether wax seal is cracked */
  sealCracked?: boolean
  /** On ribbon untied */
  onRibbonUntie?: () => void
  /** Gift tag text */
  tagText?: string
  className?: string
  /** Wrapping paper color variant */
  paperColor?: 'paper' | 'blush' | 'navy'
  label?: string
}

/**
 * Parcel — layered box with flap, lining pattern, corner shadows, wrapping
 * paper, ribbon, wax seal and gift tag. Top-left light source shadows.
 */
export function Parcel({
  open = false,
  ribbonTied = true,
  sealCracked = false,
  onRibbonUntie,
  tagText = 'For You',
  className = '',
  paperColor = 'paper',
  label = 'Sealed parcel',
}: ParcelProps) {
  const reduceMotion = useReducedMotion()

  const PAPER_BG: Record<string, string> = {
    paper: '#F3EBDD',
    blush: '#D9A7A0',
    navy: '#1F2A44',
  }

  const bg = PAPER_BG[paperColor] || PAPER_BG.paper
  const ink = paperColor === 'navy' ? '#F3EBDD' : '#2B2118'

  return (
    <div
      className={`relative inline-block ${className}`}
      aria-label={label}
    >
      {/* Table shadow cast by parcel */}
      <motion.div
        className="absolute -bottom-4 left-2 right-2 h-4 rounded-full bg-black/10 blur-md"
        animate={{ scale: open ? 0.85 : 1, opacity: open ? 0.5 : 0.7 }}
        transition={{ duration: 0.5 }}
      />

      {/* Wrapping paper box body */}
      <motion.div
        className="relative w-48 h-36 rounded-lg overflow-hidden shadow-tactile-parcel"
        style={{
          backgroundColor: bg,
          color: ink,
        }}
        animate={{
          rotate: open ? -1 : 0,
          scale: open ? 0.97 : 1,
        }}
        transition={{
          duration: reduceMotion ? 0 : 0.5,
          type: 'spring',
          stiffness: 260,
          damping: 22,
        }}
      >
        {/* Box edge / thickness (right + bottom darker edge) */}
        <div className="absolute inset-0 border-t-2 border-l-2 border-black/10 pointer-events-none" />
        <div className="absolute -right-1 bottom-1 h-full w-1 bg-black/15 pointer-events-none" />
        <div className="absolute right-1 -bottom-1 h-1 w-full bg-black/15 pointer-events-none" />

        {/* Lid flap (top portion) that lifts when opened */}
        <AnimatePresence mode="wait">
          {!open && (
            <motion.div
              key="lid"
              className="absolute inset-x-0 top-0 h-[35%] bg-[#E7DAC2] border-b-2 border-black/10 flex items-center justify-center"
              initial={{ rotateX: 0 }}
              animate={{ rotateX: 0 }}
              exit={{
                rotateX: -95,
                transition: {
                  duration: reduceMotion ? 0 : 0.45,
                  ease: 'easeInOut',
                },
              }}
            >
              {/* Lining pattern visible on underside of flap */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'linear-gradient(45deg, rgba(43,33,24,0.08) 25%, transparent 25%, transparent 50%, rgba(43,33,24,0.08) 50%, rgba(43,33,24,0.08) 75%, transparent 75%, transparent 100%)',
                backgroundSize: '16px 16px',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interior tissue / contents area (revealed when open) */}
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="interior"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
              className="absolute inset-x-4 top-[35%] bottom-4 bg-[#F3EBDD]/60 rounded-lg border border-[#E7DAC2]/40 flex items-center justify-center"
            >
              <div className="text-center text-xs uppercase tracking-widest text-[#5a4a3b]/70 font-semibold">
                Contents revealed
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ribbon (drapes across, can be untied by dragging) */}
      <Ribbon
        tied={ribbonTied && !open}
        onUntie={onRibbonUntie}
        color="oxblood"
        className="absolute -top-6 left-1/4 right-1/4 z-20"
      />

      {/* Wax seal over ribbon knot */}
      <WaxSeal
        monogram="K"
        cracked={sealCracked || open}
        scale={0.85}
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-30"
        label="Wax seal"
      />

      {/* Gift tag hanging from ribbon */}
      <GiftTag text={tagText} className="absolute top-[-18px] right-4 z-20" />
    </div>
  )
}
