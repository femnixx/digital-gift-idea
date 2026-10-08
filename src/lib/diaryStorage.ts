'use client'

import { createDiary } from '@/lib/repositories/diaryRepository'
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import type { LoveDiary } from '@/types'

export async function saveDiaryToStorage(diary: LoveDiary): Promise<{ success: boolean; error?: string }> {
  const result = await createDiary(
    {
      title: diary.title,
      description: diary.description || '',
      entry_ids: diary.entry_ids || [],
      cover_image: diary.cover_image || undefined,
    },
    ''
  )
  if (result && 'success' in result && !result.success) {
    return { success: false, error: result.error }
  }
  if (result && 'id' in result) {
    return { success: true }
  }
  return { success: false, error: 'Failed to create diary' }
}
