'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { Heart, Edit3, X, EyeOff, CheckCircle2, ArrowLeft, Calendar, Share2 } from 'lucide-react'
import { useNav } from '@/hooks/useNav'
import { format } from 'date-fns'
import { DigitalBouquet } from '@/components/features/DigitalBouquet'
import { PolaroidDeck } from '@/components/features/PolaroidDeck'
import { ScratchCard } from '@/components/features/ScratchCard'
import { ScratchCardCustomizer } from '@/components/features/ScratchCardCustomizer'
import { OpenWhenLetters } from '@/components/features/OpenWhenLetters'
import { CassettePlayer, MiniCassettePlayer } from '@/components/features/CassettePlayer'
import { CoffeeDateWidget, CoffeeDateGrid } from '@/components/features/CoffeeDate'
import { CoffeeDateSelector } from '@/components/features/CoffeeDateSelector'
import { TimezoneClock } from '@/components/features/TimezoneClock'
import { LetterEditor } from '@/components/features/LetterEditor'
import type { Entry, ScratchCard as ScratchCardType, CoffeeDate as AppCoffeeDate, BouquetFlower, FlowerType } from '@/types'
import { FLOWER_CONFIG } from '@/types'

interface DailyEntryPageProps {
  entry: Entry
}

export function DailyEntryPage({ entry }: DailyEntryPageProps) {
  const { back } = useNav()
  const [isEditing, setIsEditing] = useState(false)
  const [showScratchCustomizer, setShowScratchCustomizer] = useState(false)
  const [editingScratchCard, setEditingScratchCard] = useState<ScratchCardType | null>(null)
  const [editingOpenWhenLetters, setEditingOpenWhenLetters] = useState(false)
  const [editingCoffeeDates, setEditingCoffeeDates] = useState(false)
  const [editingBouquet, setEditingBouquet] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

     const ctx = gsap.context(() => {}, containerRef.current)
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    tl.from(containerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
    })

    return () => ctx.revert()
  }, [])

  const handleCardsChange = (cards: any[]) => {
    Object.assign(entry, { polaroid_cards: cards, updated_at: new Date().toISOString() })
  }

  const handleScratchCardsChange = (cards: ScratchCardType[]) => {
    Object.assign(entry, { scratch_cards: cards, updated_at: new Date().toISOString() })
  }

  const handleLetterSave = (content: { message: string }, extra?: Record<string, any>) => {
    const merged = { ...(entry.content as Record<string, any>), ...content, ...extra }
    const updated = { ...entry, content: merged, updated_at: new Date().toISOString() } as Entry
    Object.assign(entry, updated)
    setIsEditing(false)
  }

  const handleOpenWhenLettersSave = (letters: any[]) => {
    const updated = { ...entry, open_when_letters: letters, updated_at: new Date().toISOString() } as Entry
    Object.assign(entry, updated)
    setEditingOpenWhenLetters(false)
  }

  const handleCoffeeDatesSave = (dates: AppCoffeeDate[]) => {
    const updated = { ...entry, coffee_dates: dates, updated_at: new Date().toISOString() } as Entry
    Object.assign(entry, updated)
    setEditingCoffeeDates(false)
  }

  const handleBouquetSave = (flowers: any[]) => {
    const updated = { ...entry, bouquet_flowers: flowers, updated_at: new Date().toISOString() } as Entry
    Object.assign(entry, updated)
    setEditingBouquet(false)
  }

  const updateBouquetFlowers = (flowers: any[]) => {
    Object.assign(entry, {
      bouquet_flowers: flowers,
      updated_at: new Date().toISOString(),
    })
  }

  const handleAddFlower = () => {
    const current = entry.bouquet_flowers || []
    const newFlower = {
      id: `flower-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entry_id: entry.id,
      flower_type: 'rose' as const,
      color: '#FF0000',
      note: null,
      position_x: 50,
      position_y: 50,
      rotation: Math.random() * 30 - 15,
      scale: 0.8 + Math.random() * 0.4,
      sort_order: current.length,
      created_at: new Date().toISOString(),
      generation_seed: Math.floor(Math.random() * 1000000),
    }
    updateBouquetFlowers([...current, newFlower])
  }

  const handleRemoveFlower = (id: string) => {
    const updated = (entry.bouquet_flowers || []).filter(f => f.id !== id)
    updateBouquetFlowers(updated)
  }

  const handleUpdateFlower = (id: string, updates: Partial<BouquetFlower>) => {
    const updated = (entry.bouquet_flowers || []).map(f =>
      f.id === id ? { ...f, ...updates } : f
    )
    updateBouquetFlowers(updated)
  }

  const renderContent = () => {
    switch (entry.type) {
      case 'bouquet':
        if (editingBouquet) {
          return (
            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setEditingBouquet(false)}
                  className="px-4 py-2 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 text-sm hover:bg-stone-200 transition-colors inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Done Editing
                </button>
              </div>
              <DigitalBouquet
                flowers={entry.bouquet_flowers || []}
                isEditing={true}
                onAddFlower={handleAddFlower}
                onRemoveFlower={handleRemoveFlower}
                onUpdateFlower={handleUpdateFlower}
                onReplaceFlowers={updateBouquetFlowers}
                entryId={entry.id}
              />
            </div>
          )
        }
        return entry.bouquet_flowers && entry.bouquet_flowers.length > 0 ? (
          <DigitalBouquet flowers={entry.bouquet_flowers} />
        ) : (
          <p className="text-center text-stone-500 dark:text-stone-400 py-12">No flowers in this bouquet yet</p>
        )

      case 'polaroid':
        return (
          <PolaroidDeck
            cards={entry.polaroid_cards || []}
            entryId={entry.id}
            isEditing={isEditing}
            onCardsChange={handleCardsChange}
          />
        )

      case 'scratch_card':
        if (showScratchCustomizer) {
          return (
            <div className="max-w-2xl mx-auto">
              <ScratchCardCustomizer
                entryId={entry.id}
                card={editingScratchCard}
                onSave={(saved: ScratchCardType) => {
                  handleScratchCardsChange(
                    editingScratchCard
                      ? (entry.scratch_cards || []).map(c => c.id === saved.id ? saved : c)
                      : [...(entry.scratch_cards || []), saved]
                  )
                  setShowScratchCustomizer(false)
                  setEditingScratchCard(null)
                }}
                onCancel={() => {
                  setShowScratchCustomizer(false)
                  setEditingScratchCard(null)
                }}
              />
            </div>
          )
        }
        return entry.scratch_cards && entry.scratch_cards.length > 0 ? (
          <div className="space-y-8">
            {isEditing && (
              <div className="flex flex-wrap items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setEditingScratchCard(null)
                    setShowScratchCustomizer(true)
                  }}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Add Scratch Card
                </button>
              </div>
            )}
            {entry.scratch_cards.map((card, i) => (
              <div
                key={card.id}
                className="relative"
              >
                <ScratchCard
                  coverColor={card.cover_color}
                  coverImageUrl={card.cover_image_url}
                  revealContent={card.reveal_content as any}
                  scratchThreshold={card.scratch_threshold}
                  isEditing={isEditing}
                  onEdit={() => {
                    setEditingScratchCard(card)
                    setShowScratchCustomizer(true)
                  }}
                />
                {isEditing && (
                  <div className="absolute -top-3 -right-3 flex gap-1 z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingScratchCard(card)
                        setShowScratchCustomizer(true)
                      }}
                      className="p-1.5 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-stone-500 dark:text-stone-400 font-handwriting text-lg mb-4">No scratch cards yet</p>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditingScratchCard(null)
                  setShowScratchCustomizer(true)
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Add Your First Scratch Card
              </button>
            )}
          </div>
        )

      case 'open_when':
        return (
          <div>
            {isEditing && (
              <motion.div
                className="mb-4 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button
                  type="button"
                  onClick={() => setEditingOpenWhenLetters(prev => !prev)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    editingOpenWhenLetters
                      ? 'bg-rose-100 text-rose-600 border border-rose-200'
                      : 'bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {editingOpenWhenLetters ? <EyeOff className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {editingOpenWhenLetters ? 'Done Editing' : 'Edit Letters'}
                </button>
              </motion.div>
            )}
            {entry.open_when_letters && entry.open_when_letters.length > 0 ? (
              <OpenWhenLetters
                letters={entry.open_when_letters}
                isEditing={isEditing && editingOpenWhenLetters}
                onSave={handleOpenWhenLettersSave}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-stone-500 dark:text-stone-400 font-handwriting text-lg mb-4">No sealed letters yet</p>
                {isEditing && editingOpenWhenLetters && (
                  <p className="text-stone-500 text-sm">Click "Add New Letter" to create your first letter</p>
                )}
              </div>
            )}
          </div>
        )

      case 'voice_note':
        return entry.voice_notes && entry.voice_notes.length > 0 ? (
          <CassettePlayer notes={entry.voice_notes.map(n => ({
            id: n.id,
            title: n.title,
            audioUrl: n.media?.public_url || '',
            duration: n.duration_seconds || 0,
            waveformData: n.waveform_data as number[] | undefined,
            cassetteSide: n.cassette_side,
            transcript: n.transcript,
          }))} />
        ) : (
          <p className="text-center text-stone-500 dark:text-stone-400 py-12">No voice notes yet</p>
        )

      case 'coffee_date':
        if (editingCoffeeDates) {
          return (
            <CoffeeDateSelector
              entryId={entry.id}
              existingDates={entry.coffee_dates || []}
              onSave={handleCoffeeDatesSave}
              onCancel={() => {
                setEditingCoffeeDates(false)
              }}
              mode="edit"
            />
          )
        }
        return entry.coffee_dates && entry.coffee_dates.length > 0 ? (
          <div className="space-y-6">
            {isEditing && (
              <div className="flex flex-wrap items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setEditingCoffeeDates(true)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Coffee Dates
                </button>
              </div>
            )}
            <CoffeeDateGrid dates={entry.coffee_dates} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-stone-500 dark:text-stone-400 font-handwriting text-lg mb-4">No coffee dates yet</p>
            {isEditing && (
              <button
                type="button"
                onClick={() => setEditingCoffeeDates(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Add Your First Coffee Date
              </button>
            )}
          </div>
        )

      case 'letter':
      default:
        if (isEditing) {
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-script text-xl text-rose-700">Edit Letter</h3>
                <motion.button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:text-rose-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              <LetterEditor
                entry={entry}
                onSave={handleLetterSave}
                onCancel={() => setIsEditing(false)}
                mode="edit"
                showActions={false}
                initialContent={entry.content as any}
              />
            </motion.div>
          )
        }
        return (
          <motion.div
            className="prose prose-rose max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="font-handwriting text-xl leading-relaxed whitespace-pre-wrap text-stone-700 dark:text-stone-300">
              {typeof entry.content === 'object' && entry.content !== null && 'message' in entry.content
                ? String(entry.content.message)
                : 'A love letter from my heart to yours'}
            </div>

            {entry.media && entry.media.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {entry.media.map((media, i) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {media.type === 'image' && media.public_url && (
                      <img
                        src={media.public_url}
                        alt={media.filename || 'Memory'}
                        className="w-full h-64 object-cover rounded-xl border border-stone-200 dark:border-stone-700"
                      />
                    )}
                    {media.type === 'audio' && media.public_url && (
                      <MiniCassettePlayer audioUrl={media.public_url} />
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {entry.voice_notes && entry.voice_notes.length > 0 && (
              <CassettePlayer notes={entry.voice_notes.map(n => ({
                id: n.id,
                title: n.title,
                audioUrl: n.media?.public_url || '',
                duration: n.duration_seconds || 0,
                cassetteSide: n.cassette_side,
                transcript: n.transcript,
              }))} />
            )}
          </motion.div>
        )
    }
  }

  const getEditButton = () => {
    const typeLabels: Record<string, string> = {
      letter: 'Edit Letter',
      polaroid: 'Edit Polaroids',
      scratch_card: 'Edit Scratch Cards',
      open_when: 'Edit Open When Letters',
      coffee_date: 'Edit Coffee Date',
      bouquet: entry.bouquet_flowers && entry.bouquet_flowers.length > 0 ? 'Edit Bouquet' : 'Create Bouquet',
    }
    return typeLabels[entry.type] || 'Edit Letter'
  }

  const showEditButton = ['letter', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'bouquet'].includes(entry.type)

  return (
    <div className="min-h-screen romantic-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-rose-200/10 dark:text-rose-900/20 text-xl pointer-events-none"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 30}%`,
              }}
            >
              ♡
            </div>
          ))}
        </div>
      <main className="relative z-10 min-h-screen py-12 px-4" ref={containerRef}>
        <div className="max-w-4xl mx-auto">
          <motion.header
            className="mb-8 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => back('/')}
              className="p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            </button>

            <div className="flex items-center gap-4">
              <span className="font-handwriting text-lg text-stone-600 dark:text-stone-300">
                <Calendar className="w-4 h-4 inline mr-1" />
                {format(new Date(entry.publish_at), 'MMMM d, yyyy')}
              </span>
              <button className="p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors" aria-label="Share">
                <Share2 className="w-5 h-5 text-stone-700 dark:text-stone-300" />
              </button>
            </div>
          </motion.header>

          <motion.article
            className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {entry.media?.find(m => m.type === 'image' && m.sort_order === 0)?.public_url && (
              <div className="relative h-64 md:h-80 overflow-hidden rounded-t-2xl">
                <motion.img
                  src={entry.media.find(m => m.type === 'image' && m.sort_order === 0)!.public_url!}
                  alt={entry.title}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-medium">
                    <Heart className="w-4 h-4" />
                    {entry.type.charAt(0).toUpperCase() + entry.type.slice(1).replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 md:p-8">
              <motion.header
                className="mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="font-script text-3xl md:text-4xl lg:text-5xl text-rose-700 dark:text-rose-300 mb-4">
                  {entry.title}
                </h1>

                <div className="flex items-center justify-center gap-4 text-stone-400 dark:text-stone-500">
                  <span className="w-16 h-px bg-gradient-to-r from-transparent via-stone-300 dark:via-stone-600 to-transparent" />
                  <Heart className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                  <span className="w-16 h-px bg-gradient-to-r from-transparent via-stone-300 dark:via-stone-600 to-transparent" />
                </div>

                {showEditButton && (
                  <motion.div
                    className="mt-4 flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      type="button"
                      onClick={() => entry.type === 'bouquet' ? setEditingBouquet(true) : setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-sm hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      {getEditButton()}
                    </button>
                  </motion.div>
                )}
              </motion.header>

              {(entry.content as any)?.partnerOne && (entry.content as any)?.partnerTwo && (
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <TimezoneClock
                    partnerOne={(entry.content as any).partnerOne}
                    partnerTwo={(entry.content as any).partnerTwo}
                    distanceKm={(entry.content as any).distanceKm}
                    anniversaryDate={(entry.content as any).anniversaryDate}
                  />
                </motion.div>
              )}

              <motion.div
                className="min-h-[300px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {renderContent()}
              </motion.div>

              <motion.footer
                className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-700 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                  <span className="font-handwriting text-xl text-stone-700 dark:text-stone-200">With love, always</span>
                  <Heart className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  {format(new Date(entry.publish_at), 'MMMM d, yyyy')}
                  {' '}
                  · {entry.type.charAt(0).toUpperCase() + entry.type.slice(1).replace('_', ' ')}
                </p>
              </motion.footer>
            </div>
          </motion.article>
        </div>
      </main>
    </div>
  )
}
