'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useDemoEntries() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchEntries = async () => {
      // Check if we're in demo mode
      const isDemoMode = !(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
      )
      
      if (isDemoMode) {
        // Get from localStorage
        try {
          const storage = localStorage.getItem('digital-love-letters-demo')
          if (storage) {
            const data = JSON.parse(storage)
            setEntries(data.entries || [])
          }
        } catch {}
        setLoading(false)
        return
      }
      
      // Real Supabase fetch
      const { data } = await (supabase as any)
        .from('entries')
        .select('*')
        .eq('is_published', true)
        .lte('publish_at', new Date().toISOString())
        .order('publish_at', { ascending: false })
      
      setEntries(data || [])
      setLoading(false)
    }
    
    fetchEntries()
  }, [supabase])

  return { entries, loading }
}

export function useDemoEntry(slug: string) {
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchEntry = async () => {
      const isDemoMode = !(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
      )
      
      if (isDemoMode) {
        try {
          const storage = localStorage.getItem('digital-love-letters-demo')
          if (storage) {
            const data = JSON.parse(storage)
            const found = data.entries?.find((e: any) => e.slug === slug)
            if (found) {
              // Enrich with related data
              found.media = data.media?.filter((m: any) => m.entry_id === found.id) || []
              found.bouquet_flowers = data.bouquet_flowers?.filter((f: any) => f.entry_id === found.id) || []
              found.polaroid_cards = data.polaroid_cards?.filter((p: any) => p.entry_id === found.id) || []
              found.scratch_cards = data.scratch_cards?.filter((s: any) => s.entry_id === found.id) || []
              found.open_when_letters = data.open_when_letters?.filter((l: any) => l.entry_id === found.id) || []
              found.coffee_dates = data.coffee_dates?.filter((c: any) => c.entry_id === found.id) || []
              found.voice_notes = data.voice_notes?.filter((v: any) => v.entry_id === found.id) || []
              
              // Check unlock conditions
              const now = new Date()
              if (found.open_when_letters) {
                found.open_when_letters = found.open_when_letters.map((letter: any) => {
                  let isUnlocked = letter.is_unlocked
                  if (!isUnlocked && letter.trigger_type === 'date' && letter.trigger_value) {
                    isUnlocked = new Date(letter.trigger_value) <= now
                  }
                  return { ...letter, is_unlocked: isUnlocked }
                })
              }
              
              setEntry(found)
            }
          }
        } catch {}
        setLoading(false)
        return
      }
      
      const { data } = await (supabase as any)
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
      
      setEntry(data)
      setLoading(false)
    }
    
    fetchEntry()
  }, [slug, supabase])

  return { entry, loading }
}