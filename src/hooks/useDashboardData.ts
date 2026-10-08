'use client'

import { useEffect, useState } from 'react'
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

export function useDashboardData() {
  const [entries, setEntries] = useState<DashboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/entries')
        if (!res.ok) {
          setEntries([])
          return
        }
        const data = await res.json()
        if (cancelled) return
        setEntries(data.entries as DashboardEntry[])
      } catch {
        if (cancelled) return
        setEntries([])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { entries, loading, isDemoMode: false }
}
