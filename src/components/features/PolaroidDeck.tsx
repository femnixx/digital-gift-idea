'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Heart, RotateCcw, MessageSquare, Sparkles } from 'lucide-react'

interface PolaroidCard {
  id: string
  image_url: string
  caption: string | null
  date_tag: string | null
  back_note: string | null
  hidden_message: string | null
  tilt_degrees: number
}

interface PolaroidDeckProps {
  cards: PolaroidCard[]
  onCardFlip?: (card: PolaroidCard) => void
  isEditing?: boolean
}

export function PolaroidDeck({ cards, onCardFlip, isEditing = false }: PolaroidDeckProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [shakenCards, setShakenCards] = useState<Set<string>>(new Set())
  const [dragState, setDragState] = useState<{ cardId: string; x: number; y: number; rotation: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFlip = (card: PolaroidCard) => {
    if (isEditing) return
    setFlippedCards(prev => {
      const next = new Set(prev)
      if (next.has(card.id)) {
        next.delete(card.id)
      } else {
        next.add(card.id)
      }
      return next
    })
    onCardFlip?.(card)
  }

  const handleShake = (card: PolaroidCard) => {
    if (!card.hidden_message) return
    setShakenCards(prev => {
      const next = new Set(prev)
      next.add(card.id)
      return next
    })
    setTimeout(() => {
      setShakenCards(prev => {
        const next = new Set(prev)
        next.delete(card.id)
        return next
      })
    }, 1000)
  }

  const handleDragStart = (card: PolaroidCard, e: React.DragEvent) => {
    if (!card.hidden_message || isEditing) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setDragState({
      cardId: card.id,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rotation: card.tilt_degrees,
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    if (!dragState || isEditing) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const deltaX = x - dragState.x
    const deltaY = y - dragState.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance > 50) {
      setShakenCards(prev => {
        const next = new Set(prev)
        next.add(dragState.cardId)
        return next
      })
      setDragState(null)
    }
  }

  const handleDragEnd = () => {
    setDragState(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onDragOver={handleDrag}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => (
          <PolaroidCardComponent
            key={card.id}
            card={card}
            index={index}
            total={cards.length}
            isFlipped={flippedCards.has(card.id)}
            isShaken={shakenCards.has(card.id)}
            onFlip={() => handleFlip(card)}
            onShake={() => handleShake(card)}
            onDragStart={(e) => handleDragStart(card, e)}
            isEditing={isEditing}
          />
        ))}
      </AnimatePresence>

      {/* Hidden message toast */}
      <AnimatePresence>
        {Array.from(shakenCards).map(cardId => {
          const card = cards.find(c => c.id === cardId)
          return card?.hidden_message ? (
            <motion.div
              key={cardId}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-rose-600 text-white shadow-2xl font-handwriting text-lg max-w-md text-center"
              initial={{ y: 100, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 animate-pulse" aria-hidden="true" />
                <span className="font-serif">Hidden Message Revealed!</span>
                <Sparkles className="w-5 h-5 animate-pulse" aria-hidden="true" />
              </div>
              <p>{card.hidden_message}</p>
            </motion.div>
          ) : null
        })}
      </AnimatePresence>
    </div>
  )
}

interface PolaroidCardComponentProps {
  card: PolaroidCard
  index: number
  total: number
  isFlipped: boolean
  isShaken: boolean
  onFlip: () => void
  onShake: () => void
  onDragStart: (e: React.DragEvent) => void
  isEditing: boolean
}

function PolaroidCardComponent({
  card,
  index,
  total,
  isFlipped,
  isShaken,
  onFlip,
  onShake,
  onDragStart,
  isEditing,
}: PolaroidCardComponentProps) {
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const baseRotation = card.tilt_degrees + (Math.random() - 0.5) * 4 - 2
  const staggerDelay = index * 0.1

  const shakeAnimation = isShaken
    ? { x: [-10, 10, -10, 10, 0], rotate: [-5, 5, -5, 5, 0] }
    : {}

  return (
    <motion.div
      ref={cardRef}
      className="relative"
      style={{ zIndex: total - index }}
      initial={{ opacity: 0, y: 50, rotate: baseRotation + 180 }}
      animate={{ opacity: 1, y: 0, rotate: isShaken ? undefined : baseRotation }}
      exit={{ opacity: 0, y: -50, rotate: baseRotation - 180 }}
      transition={{
        delay: staggerDelay,
        duration: 0.6,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      animate={shakeAnimation}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={!isEditing && !isFlipped ? { y: -10, rotate: baseRotation, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } : {}}
    >
      <motion.div
        className="relative polaroid transform-style-3d w-full max-w-xs"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={onFlip}
        onDragStart={onDragStart}
        draggable={!isEditing && !!card.hidden_message}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip() }} }
        aria-label={isFlipped ? 'Flip to front' : 'Flip to back'}
      >
        {/* Front of Polaroid */}
        <div className="backface-hidden relative">
          {/* Photo */}
          <div className="aspect-square relative overflow-hidden bg-cream-100">
            <motion.img
              src={card.image_url}
              alt={card.caption || 'Memory photo'}
              className="w-full h-full object-cover transition-all duration-500"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
            />
            {/* Vignette effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* White border */}
          <div className="p-4 pb-12 bg-white">
            {/* Caption */}
            {card.caption && (
              <p className="font-handwriting text-base text-rose-700 text-center mb-2 leading-relaxed">
                {card.caption}
              </p>
            )}

            {/* Date */}
            {card.date_tag && (
              <p className="font-sans text-xs text-rose-400 text-center tracking-wider uppercase">
                {new Date(card.date_tag).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            )}

            {/* Flip hint */}
            {!isEditing && !isFlipped && (
              <motion.div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-rose-400 text-xs opacity-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
                transition={{ duration: 0.2 }}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Click to flip</span>
              </motion.div>
            )}

            {/* Shake hint */}
            {!isEditing && !isFlipped && card.hidden_message && (
              <motion.div
                className="absolute bottom-3 right-3 flex items-center gap-1 text-rose-400/60 text-xs opacity-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.2, delay: 0.5 }}
              >
                <Sparkles className="w-3 h-3 animate-pulse" aria-hidden="true" />
                <span>Shake me</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Back of Polaroid */}
        <motion.div
          className="absolute inset-0 backface-hidden bg-white rotate-y-180 p-6 flex flex-col items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Paper texture */}
          <div className="absolute inset-0 bg-[url('/images/paper-texture.svg')] opacity-10" aria-hidden="true" />

          <div className="relative z-10 w-full">
            {card.back_note ? (
              <p className="font-handwriting text-lg text-rose-700 leading-relaxed whitespace-pre-wrap text-center">
                {card.back_note}
              </p>
            ) : (
              <div className="text-center text-rose-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                <p className="font-handwriting">No note on the back yet...</p>
                <p className="text-xs mt-1">Add one in the editor!</p>
              </div>
            )}

            {/* Hidden message indicator */}
            {card.hidden_message && !isShaken && (
              <motion.div
                className="mt-6 pt-4 border-t border-rose-100 flex items-center justify-center gap-2 text-rose-400 text-sm"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Drag to reveal secret</span>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Edit badge */}
      {isEditing && (
        <div className="absolute -top-3 -right-3 flex gap-1">
          <span className="px-2 py-1 text-xs rounded-full bg-rose-100 text-rose-600 font-medium">
            Edit
          </span>
        </div>
      )}
    </motion.div>
  )
}