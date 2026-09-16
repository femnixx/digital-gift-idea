import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createClient()
    const { slug } = await params

    const { data: entry, error } = await supabase
      .from('entries')
      .select(`
        *,
        media (*),
        bouquet_flowers (*),
        polaroid_cards (*),
        scratch_cards (*),
        open_when_letters (*),
        coffee_dates (*),
        voice_notes (
          *,
          media (*)
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .lte('publish_at', new Date().toISOString())
      .single()

    if (error || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check unlock conditions for open_when letters
    const now = new Date()
    const unlockedLetters = entry.open_when_letters?.map((letter: any) => {
      let isUnlocked = letter.is_unlocked
      if (!isUnlocked && letter.unlock_at) {
        isUnlocked = new Date(letter.unlock_at) <= now
      }
      return { ...letter, is_unlocked: isUnlocked }
    }) || []

    // Increment view count
    await supabase
      .from('entries')
      .update({ view_count: (entry.view_count || 0) + 1 })
      .eq('id', entry.id)

    return NextResponse.json({ 
      entry: { 
        ...entry, 
        open_when_letters: unlockedLetters 
      } 
    })
  } catch (error) {
    console.error('Error fetching public entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}