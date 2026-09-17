'use client'

import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import type { Entry, EntryType } from '@/types'

export interface DashboardEntry {
  id: string
  slug: string
  title: string
  type: EntryType
  content: Record<string, any>
  publish_at: string
  is_published: boolean
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
}

function fromDemoStorage(): DashboardEntry[] {
  try {
    const raw = localStorage.getItem('digital-love-letters-demo')
    if (!raw) return []
    const data = JSON.parse(raw)
    return (data.entries || []) as DashboardEntry[]
  } catch {
    return []
  }
}

function readDemoEntries(): DashboardEntry[] {
  const entries = fromDemoStorage()
  if (entries.length === 0) {
    DemoDataProvider.seedDemoData()
    return fromDemoStorage()
  }
  return entries
}

export function useDashboardData() {
  const [entries, setEntries] = useState<DashboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode] = useState(() => !isSupabaseConfigured())

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isSupabaseConfigured()) {
        setEntries(readDemoEntries())
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setEntries(readDemoEntries())
          setLoading(false)
          return
        }

        const { data, error } = await (supabase as any)
          .from('entries')
          .select('id, slug, title, type, content, publish_at, is_published, is_featured, view_count, created_at, updated_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })

        if (cancelled) return
        if (error || !data) {
          setEntries(readDemoEntries())
        } else {
          setEntries(data as DashboardEntry[])
        }
      } catch {
        if (cancelled) return
        setEntries(readDemoEntries())
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { entries, loading, isDemoMode }
}
