// 'use client' removed - server component for generateMetadata

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyEntryPage } from './DailyEntryPage'
import { DailyEntryPageClient } from './DailyEntryPageClient'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getDemoEntry(slug: string) {
  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  if (!isSupabaseConfigured()) {
    return {
      title: `Digital Love Letter: ${slug}`,
      description: 'A romantic digital space for long-distance love',
    }
  }
  
  const supabase = createClient()
  
  const { data: entry } = await supabase
    .from('entries')
    .select('title, content')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!entry) {
    return { title: 'Entry Not Found' }
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
  
  if (!isSupabaseConfigured()) {
    return <DailyEntryPageClient slug={slug} />
  }
  
  const supabase = createClient()

  const { data: entry } = await supabase
    .from('entries')
    .select(`
      *,
      media (*),
      bouquet_flowers (*),
      polaroid_cards (*),
      scratch_cards (*),
      open_when_letters (*),
      coffee_dates (*),
      voice_notes (*, media (*))
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('publish_at', new Date().toISOString())
    .single()

  if (!entry) {
    notFound()
  }

  return <DailyEntryPage entry={entry} />
}
