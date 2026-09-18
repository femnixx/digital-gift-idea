'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Heart, RotateCcw, MessageSquare, Sparkles, Edit3, Plus, Shuffle, ChevronUp, ChevronDown, Trash2, X, Eye } from 'lucide-react'
import { PolaroidCustomizer } from './PolaroidCustomizer'
import type { PolaroidCard as PolaroidCardType } from '@/types'

function getFontClass(fontFamily: string) {
  const map: Record<string, string> = {
    'font-handwriting': 'font-handwriting',
    'font-serif': 'font-serif',
    'font-script': 'font-script',
    'font-sans': 'font-sans',
  }
  return map[fontFamily] || 'font-handwriting'
}

interface PolaroidDeckProps {
  cards: PolaroidCardType[]
  entryId: string
  onCardsChange?: (cards: PolaroidCardType[]) => void
  isEditing?: boolean
}

export function PolaroidDeck({ cards, entryId, onCardsChange, isEditing = false }: PolaroidDeckProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [shakenCards, setShakenCards] = useState<Set<string>>(new Set())
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [editingCard, setEditingCard] = useState<PolaroidCardType | null>(null)
  const [localCards, setLocalCards] = useState<PolaroidCardType[]>(cards)

  useEffect(() => {
    setLocalCards(cards)
  }, [cards])

  const handleFlip = (card: PolaroidCardType) => {
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
  }

  const handleShake = (card: PolaroidCardType) => {
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

  const handleDragStart = (card: PolaroidCardType, e: React.DragEvent<HTMLDivElement>) => {
    if (!card.hidden_message || isEditing) return
    e.dataTransfer.setData('text/plain', card.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId || draggedId === targetId) return

    setLocalCards(prev => {
      const updated = [...prev]
      const draggedIndex = updated.findIndex(c => c.id === draggedId)
      const targetIndex = updated.findIndex(c => c.id === targetId)
      if (draggedIndex === -1 || targetIndex === -1) return prev

      const [dragged] = updated.splice(draggedIndex, 1)
      updated.splice(targetIndex, 0, dragged)
      onCardsChange?.(updated)
      return updated
    })
  }

  const handleDragEnd = () => {
    // State updated in handleDrop
  }

  const handleSaveCard = (savedCard: PolaroidCardType) => {
    setLocalCards(prev => {
      const existing = prev.findIndex(c => c.id === savedCard.id)
      let updated: PolaroidCardType[]
      if (existing >= 0) {
        updated = prev.map(c => c.id === savedCard.id ? savedCard : c)
      } else {
        updated = [...prev, savedCard]
      }
      onCardsChange?.(updated)
      return updated
    })
    setShowCustomizer(false)
    setEditingCard(null)
  }

  const handleEditCard = (card: PolaroidCardType) => {
    setEditingCard(card)
    setShowCustomizer(true)
  }

  const handleAddCard = () => {
    setEditingCard(null)
    setShowCustomizer(true)
  }

  const handleDeleteCard = (cardId: string) => {
    setLocalCards(prev => {
      const updated = prev.filter(c => c.id !== cardId)
      onCardsChange?.(updated)
      return updated
    })
  }

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= localCards.length) return
    setLocalCards(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(index, 1)
      updated.splice(newIndex, 0, moved)
      onCardsChange?.(updated)
      return updated
    })
  }

  const handleShuffle = () => {
    setLocalCards(prev => {
      const updated = [...prev]
      for (let i = updated.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[updated[i], updated[j]] = [updated[j], updated[i]]
      }
      onCardsChange?.(updated)
      return updated
    })
  }

  const getTemplateStyles = (template: PolaroidCardType['template']) => {
    switch (template) {
      case 'vintage':
        return 'bg-amber-50 border-4 border-amber-200 shadow-polaroid sepia-[.15]'
      case 'black_white':
        return 'bg-gray-100 border-4 border-gray-700 shadow-polaroid grayscale'
      case 'colorful_border':
        return 'bg-white shadow-polaroid'
      default:
        return 'bg-white border-4 border-gray-100 shadow-polaroid'
    }
  }

  if (showCustomizer) {
    return (
      <div className="max-w-2xl mx-auto">
        <PolaroidCustomizer
          entryId={entryId}
          card={editingCard}
          onSave={handleSaveCard}
          onCancel={() => { setShowCustomizer(false); setEditingCard(null) }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center gap-3"
          >
            <button
              type="button"
              onClick={handleAddCard}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Polaroid
            </button>
            <button
              type="button"
              onClick={handleShuffle}
              disabled={localCards.length < 2}
              className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
            <span className="text-sm text-slate-500 ml-auto">
              {localCards.length} polaroid{localCards.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polaroid Grid / Deck */}
      {localCards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">📸</div>
          <p className="text-slate-500 font-handwriting text-lg mb-4">No polaroids yet</p>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddCard}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Polaroid
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {localCards.map((card, index) => {
              const isFlipped = flippedCards.has(card.id)
              const isShaken = shakenCards.has(card.id)
              const baseRotation = card.tilt_degrees + (index % 2 === 0 ? -2 : 2)

              return (
                <div
                  key={card.id}
                  draggable={isEditing}
                  onDragStart={(e) => handleDragStart(card, e)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, card.id)}
                  onDragEnd={handleDragEnd}
                  className="relative group"
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 30, rotate: baseRotation + 180 }}
                    exit={{ opacity: 0, y: -30, rotate: baseRotation - 180 }}
                    animate={{ rotate: baseRotation }}
                    transition={{ delay: index * 0.05, duration: 0.4, type: 'spring', stiffness: 100, damping: 15 }}
                  >
                  {card.template === 'colorful_border' ? (
                    <div className="p-[3px] rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400">
                      <div className="bg-white rounded-lg overflow-hidden">
                        {renderFront(card, isFlipped, isEditing, baseRotation, handleFlip, handleShake)}
                        {renderBack(card, isShaken, isFlipped)}
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-xl overflow-hidden ${getTemplateStyles(card.template)}`}>
                      {renderFront(card, isFlipped, isEditing, baseRotation, handleFlip, handleShake)}
                      {renderBack(card, isShaken, isFlipped)}
                    </div>
                  )}

                  {/* Edit Badge & Controls */}
                  {isEditing && (
                    <div className="absolute -top-3 -right-3 flex flex-col gap-1 z-20">
                      <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditCard(card)}
                            className="p-1.5 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1.5 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => handleMoveCard(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCard(index, 'down')}
                            disabled={index === localCards.length - 1}
                            className="p-1.5 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                      </div>
                    </div>
                  )}

                  {/* Drag indicator in edit mode */}
                  {isEditing && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs cursor-grab active:cursor-grabbing">
                      ⋮⋮
                    </div>
                  )}
                  </motion.div>
                </div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Hidden message toast */}
      <AnimatePresence>
        {Array.from(shakenCards).map(cardId => {
          const card = localCards.find(c => c.id === cardId)
          return card?.hidden_message ? (
            <motion.div
              key={cardId}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 font-handwriting text-lg max-w-md text-center"
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-sky-500" aria-hidden="true" />
                <span className="font-serif">Hidden Message Revealed!</span>
                <Sparkles className="w-4 h-4 text-sky-500" aria-hidden="true" />
              </div>
              <p>{card.hidden_message}</p>
            </motion.div>
          ) : null
        })}
      </AnimatePresence>
    </div>
  )
}

function renderFront(
  card: PolaroidCardType,
  isFlipped: boolean,
  isEditing: boolean,
  baseRotation: number,
  onFlip: (card: PolaroidCardType) => void,
  onShake: (card: PolaroidCardType) => void
) {
  return (
    <motion.div
      className="relative"
      style={{
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.6s'
      }}
      onClick={() => onFlip(card)}
      draggable={!isEditing && !!card.hidden_message}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(card) }}}
      aria-label={isFlipped ? 'Flip to front' : 'Flip to back'}
    >
      {/* Photo */}
      <div className={`relative overflow-hidden ${card.orientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'}`}>
        <motion.img
          src={card.image_url}
          alt={card.caption || 'Memory photo'}
          className="w-full h-full object-cover transition-all duration-500"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          whileHover={!isEditing && !isFlipped ? { scale: 1.05 } : {}}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Stickers overlay */}
        {card.stickers && card.stickers.length > 0 && (
          <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 flex-wrap px-2 pointer-events-none z-10">
            {card.stickers.map((sticker, i) => (
              <motion.span
                key={`${card.id}-sticker-${i}`}
                className="text-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring' }}
              >
                {sticker}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* White border / content */}
      <div className="p-4 pb-12 bg-white">
        {card.caption && (
          <p
            className={`${getFontClass(card.font_family)} ${card.font_size} leading-relaxed mb-2`}
            style={{ color: card.font_color, textAlign: card.text_alignment }}
          >
            {card.caption}
          </p>
        )}

        {card.date_tag && (
          <p className="text-xs text-gray-400 text-center tracking-wider uppercase">
            {new Date(card.date_tag).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Flip hint */}
        {!isEditing && !isFlipped && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Click to flip</span>
          </div>
        )}

        {/* Shake hint */}
        {!isEditing && !isFlipped && card.hidden_message && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-gray-400/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3 h-3 animate-pulse" aria-hidden="true" />
            <span>Shake me</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function renderBack(card: PolaroidCardType, isShaken: boolean, isFlipped: boolean) {
  return (
    <motion.div
      className="absolute inset-0 bg-white rotate-y-180 p-6 flex flex-col items-center justify-center"
      style={{
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="absolute inset-0 bg-[url('/images/paper-texture.svg')] opacity-10" aria-hidden="true" />

      <div className="relative z-10 w-full">
        {card.back_note ? (
          <p className="font-handwriting text-lg text-sky-700 leading-relaxed whitespace-pre-wrap text-center">
            {card.back_note}
          </p>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p className="font-handwriting">No note on the back yet...</p>
            <p className="text-xs mt-1">Add one in the editor!</p>
          </div>
        )}

        {card.hidden_message && !isShaken && (
          <motion.div
            className="mt-6 pt-4 border-t border-sky-100 flex items-center justify-center gap-2 text-sky-400 text-sm"
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
  )
}
