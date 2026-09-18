'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Mail, Lock, Unlock, Heart, Sparkles, Calendar, MapPin, Smile, Star, Eye, EyeOff, Play, Pause, Trash2, Edit3 } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { OpenWhenLetter as OpenWhenLetterType } from '@/types'

interface OpenWhenLettersProps {
  letters: OpenWhenLetterType[]
  onUnlock?: (letter: OpenWhenLetterType) => void
  onSave?: (letters: OpenWhenLetterType[]) => void
  isEditing?: boolean
  className?: string
}

const triggerIcons = {
  date: Calendar,
  location: MapPin,
  mood: Smile,
  manual: Star,
}

const triggerLabels = {
  date: 'Opens on',
  location: 'Opens at',
  mood: 'Opens when feeling',
  manual: 'Open anytime',
}

const envelopeColors = [
  { name: 'Rose', color: '#F5E6E8', border: '#E8B4B8' },
  { name: 'Lavender', color: '#F3E5F5', border: '#CE93D8' },
  { name: 'Sky', color: '#E3F2FD', border: '#90CAF9' },
  { name: 'Mint', color: '#E8F5E9', border: '#A5D6A7' },
  { name: 'Peach', color: '#FFF3E0', border: '#FFCC80' },
  { name: 'Cream', color: '#FFFDE7', border: '#FFF176' },
]

const sealEmojis = ['💌', '💕', '✨', '💖', '🌟', '💫', '🎀', '🦋', '🌹', '💐', '🎁', '💝']

export function OpenWhenLetters({ letters, onUnlock, onSave, isEditing = false, className = '' }: OpenWhenLettersProps) {
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null)
  const [showContent, setShowContent] = useState<string[]>([])
  const [jumpingLetters, setJumpingLetters] = useState<string[]>([])
  const [hasJumped, setHasJumped] = useState<string[]>([])
  const [editingLetter, setEditingLetter] = useState<OpenWhenLetterType | null>(null)
  const showContentRef = useRef<string[]>([])
  useEffect(() => { showContentRef.current = showContent }, [showContent])

  const triggerConfetti = useCallback(() => {
    try {
      const count = 200
      const fire = (angle: number) => {
        confetti({
          particleCount: count / 2,
          spread: 70,
          startVelocity: 45,
          angle,
          colors: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8E9E', '#C7CEEA', '#FFB6C1'],
          shapes: ['circle', 'square'],
          gravity: 0.8,
          ticks: 200,
          zIndex: 100,
        })
      }
      fire(60)
      setTimeout(() => fire(120), 150)
    } catch {
      // canvas-confetti not available
    }
  }, [])

  const playUnlockSound = useCallback(() => {
    // Sound effect placeholder - uncomment and provide an audio file to enable
    // const audio = new Audio('/sounds/unlock.mp3')
    // audio.volume = 0.5
    // audio.play().catch(() => {})
  }, [])

  const handleUnlock = (letter: OpenWhenLetterType) => {
    if (letter.is_unlocked) {
      setShowContent(prev => prev.includes(letter.id) ? prev.filter(id => id !== letter.id) : [...prev, letter.id])
    } else {
      setExpandedLetter(letter.id)
      setTimeout(() => {
        onUnlock?.(letter)
        setShowContent(prev => [...prev, letter.id])
        setJumpingLetters(prev => [...prev, letter.id])
        triggerConfetti()
        playUnlockSound()
        setTimeout(() => {
          setJumpingLetters(prev => prev.filter(id => id !== letter.id))
          setHasJumped(prev => [...prev, letter.id])
        }, 1800)
        setExpandedLetter(null)
      }, 1200)
    }
  }

  const handleDelete = (letterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = letters.filter(l => l.id !== letterId)
    onSave?.(updated)
  }

  const handleEdit = (letter: OpenWhenLetterType, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingLetter(letter)
  }

  const handleSaveLetter = (updatedLetter: OpenWhenLetterType) => {
    const updated = letters.map(l => l.id === updatedLetter.id ? updatedLetter : l)
    onSave?.(updated)
    setEditingLetter(null)
  }

  const getTriggerIcon = (type: string) => {
    const Icon = triggerIcons[type as keyof typeof triggerIcons] || Star
    return Icon
  }

  return (
    <div className={className}>
      {/* Add button */}
      {isEditing && (
        <motion.div
          className="mb-6 flex justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            type="button"
            onClick={() => setEditingLetter({
              id: '',
              entry_id: letters[0]?.entry_id || '',
              trigger_label: '',
              trigger_type: 'manual',
              trigger_value: null,
              envelope_color: envelopeColors[0].color,
              seal_emoji: sealEmojis[0],
              content: { title: '', message: '' },
              is_unlocked: false,
              unlocked_at: null,
              sort_order: letters.length,
              created_at: new Date().toISOString(),
            })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-500 text-white font-medium shadow-lg hover:bg-sky-600 active:scale-95 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5" />
            Add New Letter
          </motion.button>
        </motion.div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editingLetter && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <OpenWhenEditor
                letter={editingLetter}
                onSave={handleSaveLetter}
                onCancel={() => setEditingLetter(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {letters.map((letter, index) => {
          const isJumping = jumpingLetters.includes(letter.id)
          const didJump = hasJumped.includes(letter.id)
          const isShowing = showContent.includes(letter.id)
          const TriggerIcon = getTriggerIcon(letter.trigger_type)

          return (
            <motion.div
              key={letter.id}
              className="relative touch-manipulation"
              initial={{ opacity: 0, y: 30, rotate: -3 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, type: 'spring', stiffness: 120 }}
            >
              <EnvelopeCard
                letter={letter}
                isExpanded={expandedLetter === letter.id}
                isUnlocked={isShowing}
                isJumping={isJumping}
                didJump={didJump}
                onClick={() => handleUnlock(letter)}
                triggerIcon={TriggerIcon}
                triggerLabel={triggerLabels[letter.trigger_type]}
                onCloseContent={(id) => setShowContent(prev => prev.filter(lid => lid !== id))}
              />

              {/* Edit/Delete buttons */}
              {isEditing && (
                <div className="absolute top-2 right-2 flex gap-1 z-20">
                  <motion.button
                    type="button"
                    onClick={(e) => handleEdit(letter, e)}
                    className="p-2 rounded-full bg-white/90 text-sky-500 hover:bg-sky-100 shadow-sm active:scale-90 transition-all"
                    title="Edit"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => handleDelete(letter.id, e)}
                    className="p-2 rounded-full bg-white/90 text-red-500 hover:bg-red-100 shadow-sm active:scale-90 transition-all"
                    title="Delete"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Unlock animation overlay */}
      <AnimatePresence>
        {expandedLetter && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <UnlockAnimation
              letter={letters.find(l => l.id === expandedLetter)!}
              onComplete={() => setExpandedLetter(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Envelope Card Component
interface EnvelopeCardProps {
  letter: OpenWhenLetterType
  isExpanded: boolean
  isUnlocked: boolean
  isJumping: boolean
  didJump: boolean
  onClick: () => void
  triggerIcon: React.ComponentType<{ className?: string }>
  triggerLabel: string
  onCloseContent?: (letterId: string) => void
}

function EnvelopeCard({ letter, isExpanded, isUnlocked, isJumping, didJump, onClick, triggerIcon: TriggerIcon, triggerLabel, onCloseContent }: EnvelopeCardProps) {
  const [hovered, setHovered] = useState(false)
  const [touched, setTouched] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = () => setTouched(true)
  const handleTouchEnd = () => setTimeout(() => setTouched(false), 300)

  return (
    <div
      ref={cardRef}
      className="relative perspective-1000 touch-manipulation"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }}}
      aria-label={isUnlocked ? 'Open letter' : `Locked: ${letter.trigger_label}`}
    >
      {/* Envelope */}
      <motion.div
        className="relative transform-style-3d w-full aspect-[4/5] max-w-xs mx-auto cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transform: isUnlocked || didJump ? 'rotateX(180deg)' : 'rotateX(0deg)',
        }}
        animate={{
          y: (hovered || touched) && !isUnlocked && !didJump ? -8 : 0,
          rotateY: (hovered || touched) && !isUnlocked && !didJump ? 3 : 0,
          boxShadow: (hovered || touched) && !isUnlocked && !didJump
            ? '0 25px 50px -12px rgba(0,0,0,0.25)'
            : '0 10px 30px -10px rgba(0,0,0,0.15)',
          rotateX: isJumping ? [-5, 0, -8, 0, -4, 0] : 0,
        }}
        transition={{
          duration: 0.3,
          type: 'spring',
          stiffness: 200,
          rotateX: { duration: 0.6, ease: 'easeOut' }
        }}
      >
        {/* Envelope Back */}
        <div className="absolute inset-0 backface-hidden rounded-2xl" style={{ backgroundColor: letter.envelope_color }}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />

          {/* Seal on back */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-4xl">
            {letter.seal_emoji}
          </div>

          {/* Trigger info on back */}
          <div className="absolute bottom-16 left-4 right-4 text-center text-white/90">
            <p className="text-xs uppercase tracking-wider mb-1">{triggerLabel}</p>
            <p className="font-handwriting text-lg">{letter.trigger_value || 'Special moment'}</p>
          </div>
        </div>

        {/* Envelope Front */}
        <motion.div
          className="absolute inset-0 backface-hidden rounded-2xl rotate-y-180 transform-style-3d"
          style={{
            backgroundColor: letter.envelope_color,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />

          {/* Seal */}
          <motion.div
            className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl border-2 border-white/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {letter.seal_emoji}
          </motion.div>

          {/* Title */}
          <motion.div
            className="absolute top-24 left-4 right-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
              {letter.trigger_label}
            </p>
            <p className="font-serif text-xl font-semibold text-white">
              {letter.trigger_label}
            </p>
          </motion.div>

          {/* Trigger type badge */}
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TriggerIcon className="w-5 h-5 text-white" aria-hidden="true" />
            <span className="text-white text-sm font-medium">{triggerLabel}</span>
          </motion.div>

          {/* Lock/Unlock indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/80 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isUnlocked || didJump ? (
              <>
                <Unlock className="w-4 h-4" aria-hidden="true" />
                <span>Opened</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>Tap to unlock</span>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Jumping Note Animation - Letter jumps out of envelope */}
      <AnimatePresence>
        {isJumping && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-xs mx-auto"
              initial={{ y: 0, rotateX: 0, scale: 0.3, opacity: 0 }}
              animate={{
                y: [-20, -120, -180, -160],
                rotateX: [0, -30, 10, 0],
                scale: [0.3, 1.2, 0.9, 1],
                opacity: [0, 1, 1, 1],
              }}
              transition={{
                duration: 1.4,
                times: [0, 0.3, 0.6, 0.85],
                ease: ['easeOut', 'easeOut', 'easeInOut', 'easeOut'],
              }}
            >
              {/* Paper Note */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
                <div className="absolute inset-0 bg-[url('/images/paper-texture.svg')] opacity-5" aria-hidden="true" />

                {/* Sparkles around the note */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xl pointer-events-none"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${10 + Math.random() * 80}%`,
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3 + i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}

                <div className="p-4">
                  <p className="font-handwriting text-lg text-sky-700 leading-relaxed line-clamp-4">
                    {letter.content.message}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-sky-50 to-transparent" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Content (after jump) */}
      <AnimatePresence>
        {(isUnlocked || didJump) && !isJumping && (
          <motion.div
            className="absolute inset-0 z-10"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <LetterContent letter={letter} onClose={() => onCloseContent?.(letter.id)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating hearts when hovered and locked */}
      {!isUnlocked && !didJump && (hovered || touched) && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-sky-400/70 text-xl"
              style={{
                left: `${10 + i * 20}%`,
                bottom: '15%',
              }}
              animate={{
                y: [-20, -80],
                x: [0, (Math.random() - 0.5) * 30],
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2,
                delay: i * 0.15,
                ease: 'easeOut',
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              ♡
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Letter Content
interface LetterContentProps {
  letter: OpenWhenLetterType
  onClose: () => void
}

function LetterContent({ letter, onClose }: LetterContentProps) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="absolute inset-0 bg-[url('/images/paper-texture.svg')] opacity-5" aria-hidden="true" />

        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-sky-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{letter.seal_emoji}</span>
            <div>
              <p className="font-handwriting text-2xl text-sky-700 mb-1">
                {letter.content.title || letter.trigger_label}
              </p>
              {letter.unlocked_at && (
                <p className="text-sky-400 text-xs">
                  Opened {new Date(letter.unlocked_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center hover:bg-sky-100 active:scale-90 transition-all touch-manipulation"
            aria-label="Close letter"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {letter.content.image_url && (
            <motion.img
              src={letter.content.image_url}
              alt="Letter image"
              className="w-full h-48 object-cover rounded-xl mb-4 shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            />
          )}

          <motion.div
            className="font-handwriting text-lg text-sky-700 leading-relaxed whitespace-pre-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {letter.content.message}
          </motion.div>

          {/* Sound effect placeholder */}
          {/* <AudioPlayer src="/path/to/letter-audio.mp3" /> */}

          {letter.content.audio_url && (
            <motion.div
              className="mt-6 pt-4 border-t border-sky-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MiniCassettePlayer audioUrl={letter.content.audio_url} />
            </motion.div>
          )}
        </div>

        {/* Footer decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-sky-50 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sky-300" aria-hidden="true">
          <Heart className="w-4 h-4 animate-heartbeat" />
          <Sparkles className="w-4 h-4" />
          <Heart className="w-4 h-4 animate-heartbeat" />
        </div>
      </motion.div>
    </div>
  )
}

// Trigger-specific unlock animations
interface UnlockAnimationProps {
  letter: OpenWhenLetterType
  onComplete: () => void
}

function UnlockAnimation({ letter, onComplete }: UnlockAnimationProps) {
  const renderTriggerAnimation = () => {
    switch (letter.trigger_type) {
      case 'date':
        return (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.8, times: [0, 0.6, 1] }}
          >
            <motion.div
              className="text-6xl"
              animate={{ rotateY: [0, 180, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              <Calendar className="w-24 h-24 text-sky-500" />
            </motion.div>
          </motion.div>
        )

      case 'location':
        return (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: [ -100, -20, 0 ], opacity: [0, 1, 1] }}
            transition={{ duration: 0.8, times: [0, 0.7, 1] }}
          >
            <motion.div
              animate={{ y: [0, 10, -5, 0], scale: [1, 1.1, 0.95, 1] }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <MapPin className="w-24 h-24 text-sky-500" />
            </motion.div>
            {/* Ripple effect */}
            <motion.div
              className="absolute w-24 h-24 rounded-full border-4 border-sky-300"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: [0, 2, 3], opacity: [0.8, 0.4, 0] }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            <motion.div
              className="absolute w-24 h-24 rounded-full border-4 border-sky-200"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [0, 2, 3], opacity: [0.6, 0.3, 0] }}
              transition={{ duration: 1.5, delay: 0.7 }}
            />
          </motion.div>
        )

      case 'mood':
        return (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0.8, 1], opacity: [0, 1, 1, 1] }}
            transition={{ duration: 0.8, times: [0, 0.5, 0.7, 1] }}
          >
            <motion.div
              className="text-7xl"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -10, 10, 0],
              }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {letter.seal_emoji}
            </motion.div>
          </motion.div>
        )

      case 'manual':
      default:
        return (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1.2, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.6, times: [0, 0.7, 1] }}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Mail className="w-24 h-24 text-sky-500" />
            </motion.div>
          </motion.div>
        )
    }
  }

  return (
    <motion.div
      className="relative w-full max-w-md"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <div className="relative" style={{ perspective: '1000px' }}>
        <motion.div
          className="relative transform-style-3d w-full aspect-[4/5] max-w-xs mx-auto"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: [0, -20, -180] }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          {/* Envelope */}
          <div className="absolute inset-0 backface-hidden rounded-2xl" style={{ backgroundColor: letter.envelope_color }}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-4xl">
              {letter.seal_emoji}
            </div>
          </div>

          <motion.div
            className="absolute inset-0 backface-hidden rounded-2xl rotate-y-180 transform-style-3d"
            style={{
              backgroundColor: letter.envelope_color,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl border-2 border-white/30">
              {letter.seal_emoji}
            </div>
          </motion.div>
        </motion.div>

        {/* Trigger-specific animation */}
        {renderTriggerAnimation()}

        {/* Sparkles */}
        <AnimatePresence>
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: 1,
                opacity: 0,
                x: [0, Math.cos(i * 22.5) * 120],
                y: [0, Math.sin(i * 22.5) * 120],
              }}
              transition={{
                duration: 1.2,
                delay: 0.8 + i * 0.04,
                ease: 'easeOut',
              }}
            >
              ✨
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.p
        className="text-center mt-6 font-handwriting text-xl text-sky-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        "{letter.trigger_label}" is now unlocked! 💕
      </motion.p>
    </motion.div>
  )
}

// Mini Cassette for letter content
function MiniCassettePlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl
    }
  }, [audioUrl])

  return (
    <div className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl border border-sky-100">
      <audio ref={audioRef} preload="metadata" />
      <motion.button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </motion.button>
      <div className="flex-1">
        <p className="text-sky-500 text-xs uppercase tracking-wider">Voice Message</p>
        <div className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
            animate={{ width: isPlaying ? '100%' : '0%' }}
            transition={{ duration: isPlaying ? 30000 : 0.3, ease: 'linear' }}
          />
        </div>
      </div>
    </div>
  )
}

// Open When Editor Component
interface OpenWhenEditorProps {
  letter: OpenWhenLetterType
  onSave: (letter: OpenWhenLetterType) => void
  onCancel: () => void
}

export function OpenWhenEditor({ letter, onSave, onCancel }: OpenWhenEditorProps) {
  const [form, setForm] = useState({
    trigger_label: letter.trigger_label || '',
    trigger_type: letter.trigger_type || 'manual',
    trigger_value: letter.trigger_value || '',
    envelope_color: letter.envelope_color || envelopeColors[0].color,
    seal_emoji: letter.seal_emoji || sealEmojis[0],
    content: {
      title: letter.content.title || '',
      message: letter.content.message || '',
      image_url: letter.content.image_url || '',
      audio_url: letter.content.audio_url || '',
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...letter,
      ...form,
      trigger_value: form.trigger_type === 'manual' ? null : form.trigger_value,
      content: form.content,
    })
  }

  const selectedColor = envelopeColors.find(c => c.color === form.envelope_color) || envelopeColors[0]

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-script text-2xl text-sky-600">
          {letter.id ? 'Edit Letter' : 'New Letter'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-sky-50 text-sky-400 active:scale-90 transition-all touch-manipulation"
        >
          <EyeOff className="w-5 h-5" />
        </button>
      </div>

      {/* Envelope Preview */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="relative w-40 aspect-[4/5] rounded-2xl shadow-xl"
          style={{ backgroundColor: form.envelope_color }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rounded-2xl" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl border-2 border-white/30">
            {form.seal_emoji}
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
            {selectedColor.name}
          </div>
        </motion.div>
      </div>

      {/* Trigger Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Trigger Type</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(triggerLabels).map(([type, label]) => {
            const Icon = triggerIcons[type as keyof typeof triggerIcons]
            return (
              <button
                key={type}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, trigger_type: type as any }))}
                className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all active:scale-95 touch-manipulation ${
                  form.trigger_type === type
                    ? 'border-sky-500 bg-sky-50 text-sky-600'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Trigger Label */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Trigger Label</label>
        <input
          type="text"
          value={form.trigger_label}
          onChange={(e) => setForm(prev => ({ ...prev, trigger_label: e.target.value }))}
          placeholder="e.g., Open when you miss me"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
          required
        />
      </div>

      {/* Trigger Value (not for manual) */}
      {form.trigger_type !== 'manual' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {form.trigger_type === 'date' ? 'Date' : form.trigger_type === 'location' ? 'Location' : 'Mood'}
          </label>
          <input
            type={form.trigger_type === 'date' ? 'date' : 'text'}
            value={form.trigger_value}
            onChange={(e) => setForm(prev => ({ ...prev, trigger_value: e.target.value }))}
            placeholder={form.trigger_type === 'location' ? 'e.g., Paris, France' : 'e.g., Feeling sad'}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
          />
        </div>
      )}

      {/* Envelope Color */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Envelope Color</label>
        <div className="flex flex-wrap gap-2">
          {envelopeColors.map((color) => (
            <button
              key={color.color}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, envelope_color: color.color }))}
              className={`w-10 h-10 rounded-full border-2 transition-all active:scale-90 touch-manipulation ${
                form.envelope_color === color.color ? 'border-sky-500 ring-2 ring-sky-200' : 'border-transparent'
              }`}
              style={{ backgroundColor: color.color }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Seal Emoji */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Seal Emoji</label>
        <div className="flex flex-wrap gap-2">
          {sealEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, seal_emoji: emoji }))}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all active:scale-90 touch-manipulation ${
                form.seal_emoji === emoji ? 'bg-sky-100 ring-2 ring-sky-500' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Message Title (optional)</label>
        <input
          type="text"
          value={form.content.title}
          onChange={(e) => setForm(prev => ({ ...prev, content: { ...prev.content, title: e.target.value } }))}
          placeholder="A title for your letter"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
        />
      </div>

      {/* Message Content */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
        <textarea
          value={form.content.message}
          onChange={(e) => setForm(prev => ({ ...prev, content: { ...prev.content, message: e.target.value } }))}
          placeholder="Write your heartfelt message..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all resize-none font-handwriting text-lg"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 active:scale-95 transition-all touch-manipulation"
        >
          Cancel
        </button>
        <motion.button
          type="submit"
          className="flex-1 px-6 py-3 rounded-xl bg-sky-500 text-white font-medium shadow-lg hover:bg-sky-600 active:scale-95 transition-all touch-manipulation"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          Save Letter
        </motion.button>
      </div>
    </form>
  )
}
