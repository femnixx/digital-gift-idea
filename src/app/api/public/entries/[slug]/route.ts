import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { getEntryBySlug } from '@/lib/neon/db'
import { sql } from '@/lib/neon/auth'

/**
 * Postgres returns DECIMAL columns as strings ("-6.00"). Without this the
 * creator's API returned a number while the recipient's returned a string for
 * the same field, so a client reading both saw two different types.
 */
function normaliseCard(row: Record<string, any>) {
  return {
    ...row,
    tilt_degrees:
      row.tilt_degrees === null || row.tilt_degrees === undefined ? 0 : Number(row.tilt_degrees),
    sort_order: Number(row.sort_order ?? 0),
    stickers: Array.isArray(row.stickers) ? row.stickers : [],
  }
}

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

    const [media, scrapbookPages, scrapbookItems, polaroidCards, scratchCards, openWhenLetters, coffeeDates, voiceNotes, bucketList] = await Promise.all([
      sql`SELECT * FROM media WHERE entry_id = ${entry.id} ORDER BY sort_order ASC, created_at ASC`,
      sql`SELECT sp.id, sp.entry_id, sp.layout_type, sp.background_color, sp.background_image, sp.created_at, sp.updated_at FROM scrapbook_pages sp WHERE sp.entry_id = ${entry.id} ORDER BY sp.created_at ASC`,
      sql`SELECT si.* FROM scrapbook_items si JOIN scrapbook_pages sp ON sp.id = si.page_id WHERE sp.entry_id = ${entry.id} ORDER BY sp.created_at ASC, si.z_index ASC, si.created_at ASC`,
      sql`SELECT * FROM polaroid_cards WHERE entry_id = ${entry.id} ORDER BY sort_order ASC, created_at ASC`,
      sql`SELECT * FROM scratch_cards WHERE entry_id = ${entry.id} ORDER BY created_at ASC`,
      sql`SELECT * FROM open_when_letters WHERE entry_id = ${entry.id} ORDER BY sort_order ASC, created_at ASC`,
      sql`SELECT * FROM coffee_dates WHERE entry_id = ${entry.id} ORDER BY created_at ASC`,
      sql`SELECT v.*, m.public_url AS media_public_url, m.storage_path AS media_storage_path
         FROM voice_notes v
         LEFT JOIN media m ON m.id = v.media_id
         WHERE v.entry_id = ${entry.id} ORDER BY v.created_at ASC`,
      sql`SELECT id, entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at FROM bucket_list WHERE entry_id = ${entry.id} ORDER BY dream_date ASC, sort_order ASC, created_at ASC`,
    ])

    const now = new Date()
    const unlockedLetters = (openWhenLetters || []).map((letter: any) => {
      let isUnlocked = letter.is_unlocked
      if (!isUnlocked && letter.unlock_at) {
        isUnlocked = new Date(letter.unlock_at) <= now
      }
      return { ...letter, is_unlocked: isUnlocked }
    })

    // Point every media row at the permanent streaming route. Uploaded files
    // have public_url null, which made <img src={public_url}> render nothing.
    // These paths never expire because they carry no signature.
    const publicMedia = (media || []).map((m: any) => ({
      ...m,
      public_url: m.public_url || `/api/public/entries/${slug}/media/${m.id}`,
    }))

    // Build a media lookup so scrapbook items can resolve their image URLs.
    const mediaUrlById: Record<string, string> = {}
    for (const m of publicMedia) {
      mediaUrlById[m.id] = m.public_url || `/api/public/entries/${slug}/media/${m.id}`
    }

    // Attach items to their parent pages, resolving media URLs.
    const scrapbookPagesWithItems = (scrapbookPages as any[] || []).map((page: any) => {
      const pageItems = (scrapbookItems as any[] || [])
        .filter((item: any) => item.page_id === page.id)
        .map((item: any) => ({
          ...item,
          image_url: item.image_url || (item.media_id ? mediaUrlById[item.media_id] : null),
        }))
      return { ...page, items: pageItems }
    })
    await sql`UPDATE entries SET view_count = coalesce(view_count, 0) + 1 WHERE id = ${entry.id}`

    return NextResponse.json(
      {
        entry: {
          ...entry,
          media: publicMedia,
           scrapbook_pages: scrapbookPagesWithItems,
          polaroid_cards: (polaroidCards as any[]).map(normaliseCard),
          scratch_cards: scratchCards,
          open_when_letters: unlockedLetters,
          coffee_dates: coffeeDates,
          voice_notes: (voiceNotes as any[]).map((note) => ({
            ...note,
            media: note.media_id
              ? {
                  id: note.media_id,
                  public_url:
                    note.media_public_url ||
                    `/api/public/entries/${slug}/media/${note.media_id}`,
                  storage_path: note.media_storage_path,
                }
              : null,
          })),
           bucket_list: bucketList,
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
