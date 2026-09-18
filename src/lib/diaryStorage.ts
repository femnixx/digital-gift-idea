'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import type { LoveDiary } from '@/types'

export async function saveDiaryToStorage(diary: LoveDiary): Promise<{ success: boolean; error?: string }> {
  const supabaseConfigured = isSupabaseConfigured()

  if (supabaseConfigured) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await (supabase as any)
        .from('love_diaries')
        .insert({
          user_id: user.id,
          title: diary.title,
          description: diary.description || '',
          entry_ids: diary.entry_ids,
          cover_image: diary.cover_image || null,
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
  const existingDiaries = storage.love_diaries || []
  existingDiaries.unshift(diary)
  storage.love_diaries = existingDiaries
  DemoDataProvider.setStorage(storage)

  return { success: true }
}
