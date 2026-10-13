'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Mail, Flower2, Camera, ScanFace, Clock, Coffee, AudioLines } from 'lucide-react'
import type { EntryType } from '@/types'
import { GIFT_LABELS } from '@/lib/gifts/catalog'

/**
 * Opening ceremony shown to a recipient before the gift's contents.
 *
 * Every service gets the same interaction — a sealed cover the visitor opens —
 * but a distinct animation that matches what is inside, so a love letter
 * arrives as an envelope opening, a bouquet as flowers blooming, and so on.
 * Keeping the interaction identical and only the visuals per-service is what
 * makes the set feel like one product rather than seven unrelated pages.
 *
 * Props are split the same way as the other primitives: `type` is required
 * because the animation cannot be chosen without it; `title`, `onOpened` and
 * `autoOpenAfterMs` are optional.
 */

export interface GiftOpeningProps {
  /** Required: which service this gift is, and so which animation plays. */
  type: EntryType
  /** Optional: the gift's name, shown on the cover. */
  title?: string
  /** Optional: called once the cover has finished opening. */
  onOpened?: () => void
  /**
   * Optional: open automatically after this many milliseconds instead of
   * waiting for a tap. Omit to require an explicit action, which is the
   * default so a recipient is never shown contents before they chose to look.
   */
  autoOpenAfterMs?: number
}

const ICONS: Record<EntryType, typeof Mail> = {
  letter: Mail,
  bouquet: Flower2,
  polaroid: Camera,
  scratch_card: ScanFace,
  open_when: Clock,
  coffee_date: Coffee,
  voice_note: AudioLines,
}

/** Seconds each animation runs before the cover is dismissed. */
const OPEN_DURATION = 1.5

export function GiftOpening({ type, title, onOpened, autoOpenAfterMs }: GiftOpeningProps) {
  const reduceMotion = useReducedMotion()
  const [opened, setOpened] = useState(false)
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const Icon = ICONS[type]
  const label = GIFT_LABELS[type]

  // With reduced motion there is no ceremony to sit through, so go straight in.
  useEffect(() => {
    if (reduceMotion) {
      setOpened(true)
      setDone(true)
      onOpened?.()
      return
    }

    if (autoOpenAfterMs !== undefined) {
      timer.current = setTimeout(() => setOpened(true), autoOpenAfterMs)
    }

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [reduceMotion, autoOpenAfterMs, onOpened])

  useEffect(() => {
    if (!opened) return
    const dismiss = setTimeout(() => {
      setDone(true)
      onOpened?.()
    }, reduceMotion ? 0 : OPEN_DURATION * 1000)
    return () => clearTimeout(dismiss)
  }, [opened, reduceMotion, onOpened])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-base"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
        >
          {/* Dim the page behind so the cover reads as a layer above it. */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-2 to-base" />

          <div className="relative flex flex-col items-center gap-8 px-6 text-center">
            <Cover type={type} opened={opened} />

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: opened ? 0 : 1, y: opened ? -8 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
            >
              <p className="text-sm uppercase tracking-widest text-body-muted">
                {title ? title : 'A gift for you'}
              </p>
              <h1 className="font-serif text-3xl text-brand flex items-center justify-center gap-3">
                <Icon className="w-7 h-7" />
                {label}
              </h1>
            </motion.div>

            {!opened && (
              <motion.button
                onClick={() => setOpened(true)}
                className="btn btn-primary btn-lg"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.25 }}
              >
                Open it
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** The visible cover, with the per-service animation applied once opened. */
function Cover({ type, opened }: { type: EntryType; opened: boolean }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    // A still representation is enough when motion is not welcome.
    return (
      <div className="w-56 h-56 rounded-3xl bg-surface border-2 border-line flex items-center justify-center">
        <SealedGlyph type={type} />
      </div>
    )
  }

  return (
    <motion.div
      className="relative w-56 h-56"
      animate={opened ? 'open' : 'sealed'}
      variants={{ sealed: {}, open: {} }}
    >
      {type === 'letter' && <EnvelopeCover opened={opened} />}
      {type === 'open_when' && <WaxSealCover opened={opened} />}
      {type === 'bouquet' && <BouquetCover opened={opened} />}
      {type === 'polaroid' && <PolaroidCover opened={opened} />}
      {type === 'scratch_card' && <FoilCover opened={opened} />}
      {type === 'coffee_date' && <SteamCover opened={opened} />}
      {type === 'voice_note' && <CassetteCover opened={opened} />}
    </motion.div>
  )
}

/**
 * A common silhouette, used both as the reduced-motion still and as the icon
 * inside the covers so the set stays visually consistent.
 */
function SealedGlyph({ type }: { type: EntryType }) {
  const Icon = ICONS[type]
  return <Icon className="w-20 h-20 text-brand" aria-hidden />
}

/* ------------------------------------------------------------------ *
 * Per-service covers. Each is built from the same theme tokens so light
 * and dark mode both work, and each exposes the same "opened" moment.
 * ------------------------------------------------------------------ */

function EnvelopeCover({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* Body */}
      <div className="absolute inset-x-0 bottom-0 h-40 rounded-2xl bg-surface border-2 border-line shadow-envelope" />
      {/* Flap, hinged at the top */}
      <motion.div
        className="absolute inset-x-0 top-0 h-20 origin-top rounded-t-2xl bg-surface-2 border-2 border-line"
        animate={{ rotateX: opened ? -170 : 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      />
      {/* Letter sliding out */}
      <motion.div
        className="absolute inset-x-4 bottom-16 h-32 rounded-lg bg-card border border-line"
        animate={{ y: opened ? -130 : 0, opacity: opened ? 1 : 0 }}
        transition={{ duration: 0.8, delay: opened ? 0.45 : 0, ease: 'easeOut' }}
      />
    </div>
  )
}

function WaxSealCover({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="absolute inset-6 rounded-full border-4 border-line bg-surface-2"
        animate={{ scale: opened ? 1.25 : 1, opacity: opened ? 0.35 : 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.div
        className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white"
        animate={{ scale: opened ? 0.4 : 1, rotate: opened ? 25 : 0 }}
        transition={{ duration: 0.5, ease: 'backOut' }}
      >
        <Clock className="w-9 h-9" />
      </motion.div>
    </div>
  )
}

function BouquetCover({ opened }: { opened: boolean }) {
  const petals = useMemo(() => Array.from({ length: 9 }, (_, i) => i), [])

  return (
    <div className="absolute inset-0 flex items-end justify-center gap-1.5 pb-4">
      {petals.map((i) => (
        <motion.div
          key={i}
          className="w-5 rounded-full bg-brand"
          style={{ height: 26 + (i % 4) * 12 }}
          initial={{ scaleY: 0.15, opacity: 0.4 }}
          animate={{ scaleY: opened ? 1 : 0.15, opacity: opened ? 1 : 0.4 }}
          transition={{ duration: 0.6, delay: opened ? i * 0.07 : 0, ease: 'backOut' }}
        />
      ))}
    </div>
  )
}

function PolaroidCover({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="w-36 h-44 rounded-md bg-card border-4 border-line shadow-polaroid flex items-center justify-center"
        animate={{ rotate: opened ? -4 : 0, y: opened ? -10 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="w-24 h-24 rounded-sm bg-surface-2"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: opened ? 1 : 0.15 }}
          transition={{ duration: 1.1 }}
        />
      </motion.div>
    </div>
  )
}

function FoilCover({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-line bg-surface">
      <motion.div
        className="absolute inset-0 bg-brand"
        style={{ opacity: 0.22 }}
        animate={{ opacity: opened ? 0 : 0.22 }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: opened ? 0 : 1, scale: opened ? 1.4 : 1 }}
        transition={{ duration: 0.6 }}
      >
        <ScanFace className="w-20 h-20 text-brand" />
      </motion.div>
    </div>
  )
}

function SteamCover({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 flex items-end justify-center">
      <div className="w-28 h-24 rounded-t-3xl rounded-b-lg bg-surface border-2 border-line" />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 rounded-full bg-line"
          style={{ bottom: 96, left: 96 + i * 28, height: 60 }}
          initial={{ opacity: 0, y: 20 }}
          animate={
            opened
              ? { opacity: [0, 0.8, 0], y: [20, -40, -80] }
              : { opacity: 0, y: 20 }
          }
          transition={{ duration: 2, repeat: opened ? Infinity : 0, delay: i * 0.35 }}
        />
      ))}
    </div>
  )
}

function CassetteCover({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 rounded-2xl border-2 border-line bg-surface p-5 flex flex-col justify-center gap-4">
      <div className="h-16 rounded-lg bg-surface-2 border border-line relative overflow-hidden">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-line bg-surface"
            style={{ left: 44 + i * 88 }}
            animate={{ rotate: opened ? 1080 : 0 }}
            transition={{ duration: opened ? 2.4 : 0, ease: 'linear', repeat: opened ? Infinity : 0 }}
          />
        ))}
      </div>
      <div className="h-2 w-3/4 mx-auto rounded-full bg-line" />
      <div className="flex items-center justify-center gap-2 text-brand">
        <AudioLines className="w-6 h-6" />
      </div>
    </div>
  )
}
