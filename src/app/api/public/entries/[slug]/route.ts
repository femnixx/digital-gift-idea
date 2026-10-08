import { NextRequest, NextResponse } from 'next/server'
import { getEntryBySlug, getMediaByEntry, getBouquetFlowersByEntry, getPolaroidCardsByEntry, getScratchCardsByEntry, getOpenWhenLettersByEntry, getCoffeeDatesByEntry, getVoiceNotesByEntry } from '@/lib/neon/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const entry = await getEntryBySlug(slug)
    if (!entry || !entry.is_published || new Date(entry.publish_at) > new Date()) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const [media, bouquetFlowers, polaroidCards, scratchCards, openWhenLetters, coffeeDates, voiceNotes] = await Promise.all([
      getMediaByEntry(entry.id),
      getBouquetFlowersByEntry(entry.id),
      getPolaroidCardsByEntry(entry.id),
      getScratchCardsByEntry(entry.id),
      getOpenWhenLettersByEntry(entry.id),
      getCoffeeDatesByEntry(entry.id),
      getVoiceNotesByEntry(entry.id),
    ])

    const now = new Date()
    const unlockedLetters = (openWhenLetters || []).map((letter: any) => {
      let isUnlocked = letter.is_unlocked
      if (!isUnlocked && letter.unlock_at) {
        isUnlocked = new Date(letter.unlock_at) <= now
      }
      return { ...letter, is_unlocked: isUnlocked }
    })

    return NextResponse.json({
      entry: {
        ...entry,
        media,
        bouquet_flowers: bouquetFlowers,
        polaroid_cards: polaroidCards,
        scratch_cards: scratchCards,
        open_when_letters: unlockedLetters,
        coffee_dates: coffeeDates,
        voice_notes: voiceNotes,
      },
    })
  } catch (error) {
    console.error('Error fetching public entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
