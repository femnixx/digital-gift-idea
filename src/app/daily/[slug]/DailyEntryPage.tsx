'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { Heart, Edit3, X, EyeOff, CheckCircle2, ArrowLeft, Calendar, Share2 } from 'lucide-react'
import { useNav } from '@/hooks/useNav'
import { format } from 'date-fns'
import { PolaroidDeck } from '@/components/features/PolaroidDeck'
import { ScratchCard } from '@/components/features/ScratchCard'
import { ScratchCardCustomizer } from '@/components/features/ScratchCardCustomizer'
import { OpenWhenLetters } from '@/components/features/OpenWhenLetters'
import { CassettePlayer, MiniCassettePlayer } from '@/components/features/CassettePlayer'
import { CoffeeDateWidget, CoffeeDateGrid } from '@/components/features/CoffeeDate'
import { CoffeeDateSelector } from '@/components/features/CoffeeDateSelector'
import { TimezoneClock } from '@/components/features/TimezoneClock'
import { LetterEditor } from '@/components/features/LetterEditor'
import { BucketList } from '@/components/features/BucketList'
import { Scrapbook } from '@/components/features/Scrapbook'
import { GiftOpening } from '@/components/gift/GiftOpening'
import type { Entry, ScratchCard as ScratchCardType, CoffeeDate as AppCoffeeDate, BucketListItem, ScrapbookPage, Media } from '@/types'

interface DailyEntryPageProps {
  entry: Entry
}

export function DailyEntryPage({ entry }: DailyEntryPageProps) {
  const { back } = useNav()
  const [isEditing, setIsEditing] = useState(false)
  // The recipient sees the opening ceremony before the contents are revealed.
  const [opened, setOpened] = useState(false)
  const [showScratchCustomizer, setShowScratchCustomizer] = useState(false)
  const [editingScratchCard, setEditingScratchCard] = useState<ScratchCardType | null>(null)
  const [editingOpenWhenLetters, setEditingOpenWhenLetters] = useState(false)
  const [editingCoffeeDates, setEditingCoffeeDates] = useState(false)
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

  const renderContent = () => {
    switch (entry.type) {
      case 'bucket_list':
        return (
          <div>
            {isEditing ? (
              <BucketList
                items={entry.bucket_list || []}
                entryId={entry.id}
                isEditing={isEditing}
                onSave={(updated) => {
                  Object.assign(entry, { bucket_list: updated, updated_at: new Date().toISOString() })
                }}
              />
            ) : (
              <BucketList items={entry.bucket_list || []} entryId={entry.id} />
            )}
          </div>
        )

      case 'scrapbook':
        return (
          <div>
            <Scrapbook
              pages={entry.scrapbook_pages || []}
              media={entry.media || []}
              entryId={entry.id}
              isEditing={isEditing}
              onSave={(updated) => {
                Object.assign(entry, { scrapbook_pages: updated, updated_at: new Date().toISOString() })
              }}
            />
          </div>
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
                      className="p-1.5 rounded-full bg-base-2 text-accent hover:bg-base transition-colors"
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
            <p className="text-muted font-handwriting text-lg mb-4">No scratch cards yet</p>
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
                      ? 'bg-accent/10 text-accent border border-accent/20'
                      : 'bg-base-2 border-card-border text-text hover:bg-base'
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
            <p className="text-muted font-handwriting text-lg mb-4">No sealed letters yet</p>
            {isEditing && editingOpenWhenLetters && (
              <p className="text-muted text-sm">Click "Add New Letter" to create your first letter</p>
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
          <p className="text-center text-muted py-12">No voice notes yet</p>
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
            <p className="text-muted font-handwriting text-lg mb-4">No coffee dates yet</p>
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

      case 'bucket_list':
        return (
          <div>
            {isEditing ? (
              <BucketList
                items={entry.bucket_list || []}
                entryId={entry.id}
                isEditing={isEditing}
                onSave={(updated) => {
                  Object.assign(entry, { bucket_list: updated, updated_at: new Date().toISOString() })
                }}
              />
            ) : (
              <BucketList items={entry.bucket_list || []} entryId={entry.id} />
            )}
          </div>
        )

      case 'scrapbook':
        return (
          <div>
            <Scrapbook
              pages={entry.scrapbook_pages || []}
              media={entry.media || []}
              entryId={entry.id}
              isEditing={isEditing}
              onSave={(updated) => {
                Object.assign(entry, { scrapbook_pages: updated, updated_at: new Date().toISOString() })
              }}
            />
          </div>
        )

      case 'letter':
      default:
        if (isEditing) {
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-script text-xl text-accent">Edit Letter</h3>
                <motion.button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-lg bg-base-2 border-card-border text-text hover:text-accent transition-colors"
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
            className="prose prose-sky max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="font-handwriting text-xl leading-relaxed whitespace-pre-wrap text-text">
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
                        className="w-full h-64 object-cover rounded-xl border border-card-border"
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

  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      setShareCopied(false)
    }
  }

  const floatingHearts = Array.from({ length: 6 }).map((_, i) => (
    <div
      key={i}
      className="absolute text-accent/10 text-xl pointer-events-none"
      style={{
        left: `${10 + i * 15}%`,
        top: `${20 + (i % 3) * 30}%`,
      }}
    >
      ♡
    </div>
  ))

  // The editor affordances are for the creator, so the opening only plays for a
  // recipient who is not mid-edit.
  if (!opened && !isEditing) {
    return (
      <div className="min-h-screen bg-base">
        <GiftOpening
          type={entry.type}
          title={entry.title}
          onOpened={() => setOpened(true)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingHearts}
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
              className="p-2 rounded-lg bg-surface border border-line hover:bg-surface-2 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-body" />
            </button>

            <div className="flex items-center gap-4">
              <span className="font-handwriting text-lg text-body">
                <Calendar className="w-4 h-4 inline mr-1" />
                {format(new Date(entry.publish_at), 'MMMM d, yyyy')}
              </span>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-surface border border-line hover:bg-surface-2 transition-colors"
                aria-label="Share"
              >
                {shareCopied ? (
                  <span className="text-accent text-xs font-medium">Copied!</span>
                ) : (
                  <Share2 className="w-5 h-5 text-body" />
                )}
              </button>
            </div>
          </motion.header>

          <article
            className="bg-surface rounded-2xl border border-line"
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
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/10 text-sm font-medium">
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
                <h1 className="font-script text-3xl md:text-4xl lg:text-5xl text-accent mb-4">
                  {entry.title}
                </h1>

                <div className="flex items-center justify-center gap-4 text-muted">
                  <span className="w-16 h-px bg-gradient-to-r from-transparent via-card-border to-transparent" />
                  <Heart className="w-5 h-5 text-accent" />
                  <span className="w-16 h-px bg-gradient-to-r from-transparent via-card-border to-transparent" />
                </div>
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
                className="mt-12 pt-8 border-t border-card-border text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-accent" />
                  <span className="font-handwriting text-xl text-text">With love, always</span>
                  <Heart className="w-5 h-5 text-accent" />
                </div>
                <p className="text-muted text-sm">
                  {format(new Date(entry.publish_at), 'MMMM d, yyyy')}
                  {' '}
                  · {entry.type.charAt(0).toUpperCase() + entry.type.slice(1).replace('_', ' ')}
                </p>
              </motion.footer>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}
