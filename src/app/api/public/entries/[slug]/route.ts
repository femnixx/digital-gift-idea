import { NextRequest, NextResponse } from 'next/server'
import { getNeonClient } from '@/lib/neon'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const client = getNeonClient()
    const { slug } = await params

    const entryResult = await client.query(`SELECT * FROM entries WHERE slug = $1 AND is_published = true LIMIT 1`, [slug])
    const entry = entryResult[0]

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const [media, bouquetFlowers, polaroidCards, scratchCards, openWhenLetters, coffeeDates, voiceNotes] = await Promise.all([
      client.query(`SELECT * FROM media WHERE entry_id = $1 ORDER BY sort_order ASC, created_at ASC`, [entry.id]),
      client.query(`SELECT * FROM bouquet_flowers WHERE entry_id = $1 ORDER BY sort_order ASC, created_at ASC`, [entry.id]),
      client.query(`SELECT * FROM polaroid_cards WHERE entry_id = $1 ORDER BY sort_order ASC, created_at ASC`, [entry.id]),
      client.query(`SELECT * FROM scratch_cards WHERE entry_id = $1 ORDER BY created_at ASC`, [entry.id]),
      client.query(`SELECT * FROM open_when_letters WHERE entry_id = $1 ORDER BY sort_order ASC, created_at ASC`, [entry.id]),
      client.query(`SELECT * FROM coffee_dates WHERE entry_id = $1 ORDER BY created_at ASC`, [entry.id]),
      client.query(`SELECT * FROM voice_notes WHERE entry_id = $1 ORDER BY created_at ASC`, [entry.id]),
    ])

    const now = new Date()
    const unlockedLetters = (openWhenLetters || []).map((letter: any) => {
      let isUnlocked = letter.is_unlocked
      if (!isUnlocked && letter.unlock_at) {
        isUnlocked = new Date(letter.unlock_at) <= now
      }
      return { ...letter, is_unlocked: isUnlocked }
    })

    await client.query(`UPDATE entries SET view_count = $1 WHERE id = $2`, [(entry.view_count || 0) + 1, entry.id])

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
