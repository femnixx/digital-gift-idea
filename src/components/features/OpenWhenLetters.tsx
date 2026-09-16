'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Mail, Lock, Unlock, Heart, Sparkles, Calendar, MapPin, Smile, Star, Eye, EyeOff } from 'lucide-react'

interface OpenWhenLetter {
  id: string
  trigger_label: string
  trigger_type: 'date' | 'manual' | 'location' | 'mood'
  trigger_value: string | null
  envelope_color: string
  seal_emoji: string
  content: {
    title?: string
    message: string
    image_url?: string
    audio_url?: string
  }
  is_unlocked: boolean
  unlocked_at: string | null
}

interface OpenWhenLettersProps {
  letters: OpenWhenLetter[]
  onUnlock?: (letter: OpenWhenLetter) => void
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

export function OpenWhenLetters({ letters, onUnlock, className = '' }: OpenWhenLettersProps) {
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null)
  const [showContent, setShowContent] = useState<Set<string>>(new Set())

  const handleUnlock = (letter: OpenWhenLetter) => {
    if (letter.is_unlocked) {
      setShowContent(prev => {
        const next = new Set(prev)
        if (next.has(letter.id)) {
          next.delete(letter.id)
        } else {
          next.add(letter.id)
        }
        return next
      })
    } else {
      // Trigger unlock animation
      setExpandedLetter(letter.id)
      setTimeout(() => {
        onUnlock?.(letter)
        setShowContent(prev => new Set(prev).add(letter.id))
        setExpandedLetter(null)
      }, 1500)
    }
  }

  const getTriggerIcon = (type: string) => {
    const Icon = triggerIcons[type as keyof typeof triggerIcons] || Star
    return Icon
  }

  return (
    <div className={className}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {letters.map((letter, index) => (
          <motion.div
            key={letter.id}
            className="relative"
            initial={{ opacity: 0, y: 30, rotate: -3 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
          >
            <EnvelopeCard
              letter={letter}
              isExpanded={expandedLetter === letter.id}
              isUnlocked={showContent.has(letter.id)}
              onClick={() => handleUnlock(letter)}
              triggerIcon={getTriggerIcon(letter.trigger_type)}
              triggerLabel={triggerLabels[letter.trigger_type]}
            />
          </motion.div>
        ))}
      </div>

      {/* Unlock animation overlay */}
      <AnimatePresence>
        {expandedLetter && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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

interface EnvelopeCardProps {
  letter: OpenWhenLetter
  isExpanded: boolean
  isUnlocked: boolean
  onClick: () => void
  triggerIcon: React.ComponentType<{ className?: string }>
  triggerLabel: string
}

function EnvelopeCard({ letter, isExpanded, isUnlocked, onClick, triggerIcon: TriggerIcon, triggerLabel }: EnvelopeCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative perspective-1000"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }} }
      aria-label={letter.is_unlocked ? 'Open letter' : `Locked: ${letter.trigger_label}`}
    >
      {/* Envelope */}
      <motion.div
        className="relative transform-style-3d w-full aspect-[4/5] max-w-xs mx-auto cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transform: isUnlocked ? 'rotateX(180deg)' : 'rotateX(0deg)',
        }}
        animate={{
          y: hovered && !isUnlocked ? -8 : 0,
          rotateY: hovered && !isUnlocked ? 3 : 0,
          boxShadow: hovered && !isUnlocked ? '0 25px 50px -12px rgba(0,0,0,0.25)' : '0 10px 30px -10px rgba(0,0,0,0.15)',
        }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
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
            {letter.is_unlocked ? (
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

      {/* Letter Content */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            className="absolute inset-0 z-10"
            initial={{ opacity: 0, scale: 0.9, rotateX: -30 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: 30 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <LetterContent letter={letter} onClose={() => setShowContent(prev => {
              const next = new Set(prev)
              next.delete(letter.id)
              return next
            })} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating hearts when hovered and locked */}
      {!isUnlocked && hovered && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-rose-400/60 text-xl"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: '20%',
              }}
              animate={{
                y: [-20, -60],
                x: [0, (Math.random() - 0.5) * 40],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                ease: 'easeOut',
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

interface LetterContentProps {
  letter: OpenWhenLetter
  onClose: () => void
}

function LetterContent({ letter, onClose }: LetterContentProps) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Paper */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Paper texture */}
        <div className="absolute inset-0 bg-[url('/images/paper-texture.svg')] opacity-5" aria-hidden="true" />

        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-rose-100 flex items-start justify-between">
          <div>
            <p className="font-handwriting text-2xl text-rose-700 mb-1">
              {letter.content.title || letter.trigger_label}
            </p>
            {letter.unlocked_at && (
              <p className="text-rose-400 text-xs">
                Opened {new Date(letter.unlocked_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
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
            className="font-handwriting text-lg text-rose-700 leading-relaxed whitespace-pre-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {letter.content.message}
          </motion.div>

          {letter.content.audio_url && (
            <motion.div
              className="mt-6 pt-4 border-t border-rose-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MiniCassettePlayer audioUrl={letter.content.audio_url} />
            </motion.div>
          )}
        </div>

        {/* Footer decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-rose-50 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-rose-300" aria-hidden="true">
          <Heart className="w-4 h-4 animate-heartbeat" />
          <Sparkles className="w-4 h-4" />
          <Heart className="w-4 h-4 animate-heartbeat" />
        </div>
      </motion.div>
    </div>
  )
}

// Unlock Animation Component
function UnlockAnimation({ letter, onComplete }: { letter: OpenWhenLetter; onComplete: () => void }) {
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
          animate={{
            rotateX: [0, -20, -180],
          }}
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

        {/* Sparkles */}
        <AnimatePresence>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%)`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: 1,
                opacity: 0,
                x: [0, Math.cos(i * 30) * 100],
                y: [0, Math.sin(i * 30) * 100],
              }}
              transition={{
                duration: 1,
                delay: 0.5 + i * 0.05,
                ease: 'easeOut',
              }}
            >
              ✨
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.p
        className="text-center mt-6 font-handwriting text-xl text-rose-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
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
    <div className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl border border-rose-100">
      <audio ref={audioRef} preload="metadata" />
      <motion.button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </motion.button>
      <div className="flex-1">
        <p className="text-rose-500 text-xs uppercase tracking-wider">Voice Message</p>
        <div className="h-1.5 bg-rose-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full"
            animate={{ width: isPlaying ? '100%' : '0%' }}
            transition={{ duration: isPlaying ? 30000 : 0.3, ease: 'linear' }}
          />
        </div>
      </div>
    </div>
  )
}