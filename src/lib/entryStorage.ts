'use client'

import type { Entry } from '@/types'

export interface SaveEntryResult {
  success: boolean
  entry?: Entry
  error?: string
}

export async function saveEntryToStorage(entry: Entry): Promise<SaveEntryResult> {
  try {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: entry.title,
        type: entry.type,
        slug: entry.slug,
        content: entry.content,
        publish_at: entry.publish_at,
        is_published: entry.is_published,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create entry' }
    }

    return { success: true, entry: data.entry }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

export async function deleteEntryFromStorage(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/entries/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { success: false, error: data.error || 'Failed to delete' }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}
