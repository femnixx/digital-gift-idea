// 'use client' removed - server component for generateMetadata

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyEntryPage } from './DailyEntryPage'
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

function DailyEntryPageClient({ slug }: { slug: string }) {
  const { entry, loading } = require('@/hooks/useDemoData').useDemoEntry(slug)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full mx-auto mb-4 animate-spin" />
          <p className="font-handwriting text-sky-600">Loading your letter... ??</p>
        </div>
      </div>
    )
  }
  
  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="font-script text-3xl text-sky-600 mb-2">Letter Not Found</h1>
          <p className="text-sky-500 mb-6">This letter hasn't been written yet...</p>
          <a href="/" className="btn-primary">Back Home</a>
        </div>
      </div>
    )
  }
  
  return <DailyEntryPage entry={entry} />
}
