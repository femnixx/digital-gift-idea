'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import { addTempEntry, generateTempSlug, isTempSlug } from '@/lib/tempStorage'
import type { Entry } from '@/types'

export interface SaveEntryResult {
  success: boolean
  entry?: Entry
  error?: string
}

export async function saveEntryToStorage(entry: Entry): Promise<SaveEntryResult> {
  const supabaseConfigured = isSupabaseConfigured()

  if (supabaseConfigured) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await (supabase as any)
        .from('entries')
        .insert({
          ...entry,
          created_by: user.id,
        })

      if (error) {
        throw error
      }

      return { success: true, entry }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const slug = entry.slug?.trim() ? entry.slug : generateTempSlug()

  const tempEntry: Entry = {
    ...entry,
    slug,
  }

  if (isTempSlug(tempEntry.slug)) {
    addTempEntry(tempEntry as any)
  } else {
    const storage = DemoDataProvider.getStorage()
    const existingEntries = storage.entries || []
    existingEntries.unshift(tempEntry)
    storage.entries = existingEntries
    DemoDataProvider.setStorage(storage)
  }

  return { success: true, entry: tempEntry }
}
