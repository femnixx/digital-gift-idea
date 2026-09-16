import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyEntryPage } from './DailyEntryPage'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getDemoEntry(slug: string) {
  // Server-side demo mode - can't access localStorage
  // Return null to trigger client-side fallback
  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  if (!isSupabaseConfigured()) {
    // Demo mode - return generic metadata
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
      ? String(entry.content.description) 
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
    // Demo mode - render client component that loads from localStorage
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
      voice_notes (
        *,
        media (*)
      )
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

// Client component for demo mode
'use client'

import { useDemoEntry } from '@/hooks/useDemoData'
import { DailyEntryPage } from './DailyEntryPage'
import { motion } from 'framer-motion'
import { Loader2, Heart, Sparkles } from 'lucide-react'

interface DailyEntryPageClientProps {
  slug: string
}

function DailyEntryPageClient({ slug }: DailyEntryPageClientProps) {
  const { entry, loading } = useDemoEntry(slug)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-cream-50 to-lavender-50 flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="font-handwriting text-rose-600">Loading your letter... 💕</p>
          <div className="flex justify-center gap-1 mt-4">
            <Heart className="w-5 h-5 text-rose-400 animate-heartbeat" />
            <Sparkles className="w-5 h-5 text-lavender-500" />
            <Heart className="w-5 h-5 text-rose-400 animate-heartbeat" />
          </div>
        </motion.div>
      </div>
    )
  }
  
  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-cream-50 to-lavender-50 flex items-center justify-center">
        <motion.div className="text-center p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="font-script text-3xl gradient-text mb-2">Letter Not Found</h1>
          <p className="text-rose-500 mb-6">This letter hasn't been written yet... or maybe it's waiting for the right moment ✨</p>
          <a href="/" className="btn-primary">Back Home</a>
        </motion.div>
      </div>
    )
  }
  
  return <DailyEntryPage entry={entry} />
}