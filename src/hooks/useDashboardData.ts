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

/**
 * Website-wide aggregates, sourced from /api/admin/stats. Every field is a real
 * database total — there is no estimated or placeholder figure.
 */
export interface DashboardStats {
  diaries: number
  mediaFiles: number
  storageBytes: number
  interactions: number
  voiceNotes: number
  voiceNoteSeconds: number
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export function useDashboardData() {
  const [entries, setEntries] = useState<DashboardEntry[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [entriesRes, statsRes] = await Promise.all([
          fetch('/api/entries'),
          fetch('/api/admin/stats'),
        ])

        if (cancelled) return

        if (entriesRes.ok) {
          const data = await entriesRes.json()
          setEntries(data.entries as DashboardEntry[])
        } else {
          setEntries([])
        }

        if (statsRes.ok) {
          setStats((await statsRes.json()) as DashboardStats)
        }
      } catch {
        if (cancelled) return
        setEntries([])
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { entries, stats, loading }
}
