import { Metadata } from 'next'
import { DailyEntryPage } from './DailyEntryPage'
import { DailyEntryPageClient } from './DailyEntryPageClient'
import { getEntryBySlug } from '@/lib/neon/db'
import { getMediaByEntry, getScrapbookItemsByEntry, getPolaroidCardsByEntry, getScratchCardsByEntry, getOpenWhenLettersByEntry, getCoffeeDatesByEntry, getVoiceNotesByEntry, getBucketListByEntry } from '@/lib/neon/db'

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

  const [media, scrapbookPages, polaroidCards, scratchCards, openWhenLetters, coffeeDates, voiceNotes, bucketList] = await Promise.all([
    getMediaByEntry(entry.id),
    getScrapbookItemsByEntry(entry.id),
    getPolaroidCardsByEntry(entry.id),
    getScratchCardsByEntry(entry.id),
    getOpenWhenLettersByEntry(entry.id),
    getCoffeeDatesByEntry(entry.id),
    getVoiceNotesByEntry(entry.id),
    getBucketListByEntry(entry.id),
  ])

  const enrichedEntry = {
    ...entry,
    media,
    scrapbook_pages: scrapbookPages,
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
    bucket_list: bucketList,
  }

  return <DailyEntryPage entry={enrichedEntry} />
}
