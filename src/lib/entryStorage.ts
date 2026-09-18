'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import type { Entry } from '@/types'

export async function saveEntryToStorage(entry: Entry): Promise<{ success: boolean; error?: string }> {
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

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const storage = DemoDataProvider.getStorage()
  const existingEntries = storage.entries || []
  existingEntries.unshift(entry)
  storage.entries = existingEntries
  DemoDataProvider.setStorage(storage)

  return { success: true }
}
