import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { sql } from '@/lib/neon/auth'
import { getUserIdFromRequest } from '@/lib/api/authGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Website-wide figures that can actually be computed from the database. Every
 * number here is a real aggregate; nothing is estimated or hardcoded.
 */
export async function GET(request: NextRequest) {
  // noStore() is required, not optional. force-dynamic plus a no-store
  // Cache-Control header both proved insufficient here: the first response was
  // served from Next's route cache indefinitely, so the dashboard kept showing
  // stale zeros after real data existed.
  noStore()

  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [diaries, media, interactions, voiceNotes] = await Promise.all([
      sql`select count(*)::int as total from love_diaries where user_id = ${userId}`,
      sql`select count(*)::int as files, coalesce(sum(size_bytes), 0)::bigint as bytes
          from media m
          join entries e on e.id = m.entry_id
          where e.created_by = ${userId}`,
      sql`select count(*)::int as total
          from partner_interactions p
          join entries e on e.id = p.entry_id
          where e.created_by = ${userId}`,
      sql`select count(*)::int as total, coalesce(sum(duration_seconds), 0)::int as seconds
          from voice_notes v
          join entries e on e.id = v.entry_id
          where e.created_by = ${userId}`,
    ])

    return NextResponse.json(
      {
        diaries: diaries[0]?.total ?? 0,
        mediaFiles: media[0]?.files ?? 0,
        storageBytes: Number(media[0]?.bytes ?? 0),
        interactions: interactions[0]?.total ?? 0,
        voiceNotes: voiceNotes[0]?.total ?? 0,
        voiceNoteSeconds: voiceNotes[0]?.seconds ?? 0,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
