import { Metadata } from 'next'
import { DailyEntryPage } from './DailyEntryPage'
import { DailyEntryPageClient } from './DailyEntryPageClient'
import { getEntryBySlug } from '@/lib/neon/db'
import { getMediaByEntry, getBouquetFlowersByEntry, getPolaroidCardsByEntry, getScratchCardsByEntry, getOpenWhenLettersByEntry, getCoffeeDatesByEntry, getVoiceNotesByEntry, getMemoriesByEntry } from '@/lib/neon/db'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  const entry = await getEntryBySlug(slug)
  if (!entry || !entry.is_published) {
    return {
      title: `Digital Love Letter: ${slug}`,
      description: 'A romantic digital space for long-distance love',
    }
  }

  return {
    title: entry.title,
    description: typeof entry.content === 'object' && entry.content !== null && 'description' in entry.content
      ? String((entry.content as any).description)
      : `A love letter for you: ${entry.title}`,
    openGraph: {
      title: entry.title,
      description: `A love letter for you: ${entry.title}`,
      type: 'article',
    },
  }
}

export default async function DailyEntryRoute({ params }: PageProps) {
  const { slug } = await params

  const entry = await getEntryBySlug(slug)
  if (!entry || !entry.is_published || new Date(entry.publish_at) > new Date()) {
    return <DailyEntryPageClient slug={slug} />
  }

  const [media, bouquetFlowers, polaroidCards, scratchCards, openWhenLetters, coffeeDates, voiceNotes, memories] = await Promise.all([
    getMediaByEntry(entry.id),
    getBouquetFlowersByEntry(entry.id),
    getPolaroidCardsByEntry(entry.id),
    getScratchCardsByEntry(entry.id),
    getOpenWhenLettersByEntry(entry.id),
    getCoffeeDatesByEntry(entry.id),
    getVoiceNotesByEntry(entry.id),
    getMemoriesByEntry(entry.id),
  ])

  const enrichedEntry = {
    ...entry,
    media,
    bouquet_flowers: bouquetFlowers,
    polaroid_cards: polaroidCards,
    scratch_cards: scratchCards,
    open_when_letters: openWhenLetters,
    coffee_dates: coffeeDates,
    voice_notes: (voiceNotes as any[]).map((note) => ({
      ...note,
      media: note.media
        ? {
          ...note.media,
          public_url:
            note.media.public_url ||
            `/api/public/entries/${slug}/media/${note.media.id}`,
        }
        : null,
    })),
    memories: memories,
  }

  return <DailyEntryPage entry={enrichedEntry} />
}
