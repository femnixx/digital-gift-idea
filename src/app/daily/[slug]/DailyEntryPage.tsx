'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Heart, Sparkles, ArrowLeft, Calendar, Share2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { DigitalBouquet } from '@/components/features/DigitalBouquet'
import { PolaroidDeck } from '@/components/features/PolaroidDeck'
import { ScratchCard } from '@/components/features/ScratchCard'
import { OpenWhenLetters } from '@/components/features/OpenWhenLetters'
import { CassettePlayer, MiniCassettePlayer } from '@/components/features/CassettePlayer'
import { CoffeeDateWidget } from '@/components/features/CoffeeDate'
import { TimezoneClock } from '@/components/features/TimezoneClock'
import type { Entry } from '@/types'

interface DailyEntryPageProps {
  entry: Entry
}

export function DailyEntryPage({ entry }: DailyEntryPageProps) {
  const [showBack, setShowBack] = useState(false)

  const renderContent = () => {
    switch (entry.type) {
      case 'bouquet':
        return entry.bouquet_flowers && entry.bouquet_flowers.length > 0 ? (
          <DigitalBouquet flowers={entry.bouquet_flowers} />
        ) : (
          <p className="text-center text-rose-500 py-12">No flowers in this bouquet yet 🌱</p>
        )

      case 'polaroid':
        return entry.polaroid_cards && entry.polaroid_cards.length > 0 ? (
          <PolaroidDeck cards={entry.polaroid_cards} />
        ) : (
          <p className="text-center text-rose-500 py-12">No polaroids yet 📸</p>
        )

      case 'scratch_card':
        return entry.scratch_cards && entry.scratch_cards.length > 0 ? (
          <div className="space-y-8">
            {entry.scratch_cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <ScratchCard
                  coverColor={card.cover_color}
                  coverImageUrl={card.cover_image_url}
                  revealContent={card.reveal_content as any}
                  scratchThreshold={card.scratch_threshold}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-rose-500 py-12">No scratch cards yet 🎮</p>
        )

      case 'open_when':
        return entry.open_when_letters && entry.open_when_letters.length > 0 ? (
          <OpenWhenLetters letters={entry.open_when_letters} />
        ) : (
          <p className="text-center text-rose-500 py-12">No sealed letters yet 💌</p>
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
          <p className="text-center text-rose-500 py-12">No voice notes yet 🎵</p>
        )

      case 'coffee_date':
        return entry.coffee_dates && entry.coffee_dates.length > 0 ? (
          <div className="space-y-6">
            {entry.coffee_dates.map((date, i) => (
              <motion.div
                key={date.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <CoffeeDateWidget date={date} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-rose-500 py-12">No coffee dates yet ☕</p>
        )

      case 'letter':
      default:
        return (
          <motion.div
            className="prose prose-rose max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="font-handwriting text-xl leading-relaxed whitespace-pre-wrap text-rose-700">
              {typeof entry.content === 'object' && entry.content !== null && 'message' in entry.content
                ? String(entry.content.message)
                : 'A love letter from my heart to yours 💕'}
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
                        className="w-full h-64 object-cover rounded-2xl shadow-lg"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-cream-50 to-lavender-50">
      {/* Floating hearts background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-rose-200/30 text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 20 + Math.random() * 15,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear',
            }}
          >
            ♡
          </motion.div>
        ))}
      </div>

      <main className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.header
            className="mb-8 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/80 backdrop-blur hover:bg-white transition-colors"
              aria-label="Back home"
            >
              <ArrowLeft className="w-5 h-5 text-rose-500" />
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="font-handwriting text-lg text-rose-600">
                {format(new Date(entry.publish_at), 'MMMM d, yyyy')}
              </span>
              <button className="p-2 rounded-xl bg-white/80 backdrop-blur hover:bg-white transition-colors" aria-label="Share">
                <Share2 className="w-5 h-5 text-rose-500" />
              </button>
            </div>
          </motion.header>

          {/* Entry Card */}
          <motion.article
            className="card overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header Image */}
            {entry.media?.find(m => m.type === 'image' && m.sort_order === 0)?.public_url && (
              <div className="relative h-64 md:h-80 overflow-hidden">
                <motion.img
                  src={entry.media.find(m => m.type === 'image' && m.sort_order === 0)!.public_url!}
                  alt={entry.title}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <motion.span
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-sm font-medium"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Heart className="w-4 h-4 animate-heartbeat" />
                    {entry.type.charAt(0).toUpperCase() + entry.type.slice(1).replace('_', ' ')}
                  </motion.span>
                </div>
              </div>
            )}

            {/* Title & Content */}
            <div className="p-6 md:p-8">
              <motion.header
                className="mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="font-script text-3xl md:text-4xl lg:text-5xl gradient-text mb-4">
                  {entry.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-rose-400">
                  <span className="w-16 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
                  <Heart className="w-6 h-6 animate-heartbeat" />
                  <span className="w-16 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
                </div>
              </motion.header>

              {/* Timezone Clock (if relationship settings exist) */}
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

              {/* Main Content */}
              <motion.div
                className="min-h-[300px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {renderContent()}
              </motion.div>

              {/* Footer */}
              <motion.footer
                className="mt-12 pt-8 border-t border-rose-100 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-rose-500 animate-heartbeat" />
                  <span className="font-handwriting text-2xl text-rose-600">Made with love</span>
                  <Heart className="w-6 h-6 text-rose-500 animate-heartbeat" />
                </div>
                <p className="text-rose-400 text-sm">
                  {format(new Date(entry.publish_at), 'MMMM d, yyyy')} · 
                  {entry.type.charAt(0).toUpperCase() + entry.type.slice(1).replace('_', ' ')}
                </p>
              </motion.footer>
            </div>
          </motion.article>

          {/* Navigation hint */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="font-handwriting text-rose-500">
              Swipe or scroll for more surprises ✨
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}