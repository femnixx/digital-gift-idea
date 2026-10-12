import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { getEntryBySlug } from '@/lib/neon/db'
import { sql } from '@/lib/neon/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
// `dynamic = 'force-dynamic'` and no-store response headers alone both proved
// insufficient: a GET that preceded a delete kept answering 200 after the row was
// gone, with the stale response replayed straight from Next's route cache.
// noStore() opts this handler out of that cache on every invocation.
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  noStore()

  try {
    const { slug } = await params

    // Use the existing db.ts function
    const entry = await getEntryBySlug(slug)

    if (!entry || !entry.is_published) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404, headers: NO_STORE_HEADERS }
      )
    }

    const [media, bouquetFlowers, polaroidCards, scratchCards, openWhenLetters, coffeeDates, voiceNotes] = await Promise.all([
      sql`SELECT * FROM media WHERE entry_id = ${entry.id} ORDER BY sort_order ASC, created_at ASC`,
      sql`SELECT * FROM bouquet_flowers WHERE entry_id = ${entry.id} ORDER BY sort_order ASC, created_at ASC`,
      sql`SELECT * FROM polaroid_cards WHERE entry_id = ${entry.id} ORDER BY sort_order ASC, created_at ASC`,
      sql`SELECT * FROM scratch_cards WHERE entry_id = ${entry.id} ORDER BY created_at ASC`,
      sql`SELECT * FROM open_when_letters WHERE entry_id = ${entry.id} ORDER BY sort_order ASC, created_at ASC`,
      sql`SELECT * FROM coffee_dates WHERE entry_id = ${entry.id} ORDER BY created_at ASC`,
      sql`SELECT * FROM voice_notes WHERE entry_id = ${entry.id} ORDER BY created_at ASC`,
    ])

    const now = new Date()
    const unlockedLetters = (openWhenLetters || []).map((letter: any) => {
      let isUnlocked = letter.is_unlocked
      if (!isUnlocked && letter.unlock_at) {
        isUnlocked = new Date(letter.unlock_at) <= now
      }
      return { ...letter, is_unlocked: isUnlocked }
    })

    // Atomic increment: a read-modify-write loses concurrent increments.
    await sql`UPDATE entries SET view_count = coalesce(view_count, 0) + 1 WHERE id = ${entry.id}`

    return NextResponse.json(
      {
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
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('Error fetching public entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
