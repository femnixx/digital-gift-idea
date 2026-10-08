'use client'

import { getDiaries as getDiariesNeon, getDiaryById as getDiaryByIdNeon, createDiary as createDiaryNeon, deleteDiary as deleteDiaryNeon, addEntriesToDiary as addEntriesToDiaryNeon } from '@/lib/neon/db'
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import type { LoveDiary, CreateDiaryForm } from '@/types'

function fromDemoStorage(): LoveDiary[] {
  try {
    const raw = localStorage.getItem('digital-love-letters-demo')
    if (!raw) return []
    const data = JSON.parse(raw)
    return (data.love_diaries || []) as LoveDiary[]
  } catch {
    return []
  }
}

function readDemoDiaries(): LoveDiary[] {
  const diaries = fromDemoStorage()
  if (diaries.length === 0) return []
  return diaries
}

export async function getDiaries(): Promise<LoveDiary[]> {
  try {
    return await getDiariesNeon('')
  } catch {
    return readDemoDiaries()
  }
}

export async function getDiaryById(id: string): Promise<LoveDiary | null> {
  try {
    return await getDiaryByIdNeon(id)
  } catch {
    return readDemoDiaries().find((d) => d.id === id) || null
  }
}

export async function createDiary(form: CreateDiaryForm, userId: string): Promise<LoveDiary | { success: false; error: string }> {
  const diary: LoveDiary = {
    id: typeof window !== 'undefined' ? crypto.randomUUID() : generateId(),
    user_id: userId,
    title: form.title,
    description: form.description || '',
    entry_ids: form.entry_ids || [],
    cover_image: form.cover_image || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    entry_count: form.entry_ids?.length || 0,
    total_views: 0,
  }

  try {
    const result = await createDiaryNeon(diary)
    return result as LoveDiary
  } catch (err: any) {
    const storage = DemoDataProvider.getStorage()
    const diaries: LoveDiary[] = storage.love_diaries || []
    diaries.unshift(diary)
    storage.love_diaries = diaries
    DemoDataProvider.setStorage(storage)
    return diary
  }
}

export async function deleteDiary(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDiaryNeon(id)
    return { success: true }
  } catch (err: any) {
    const storage = DemoDataProvider.getStorage()
    const diaries: LoveDiary[] = storage.love_diaries || []
    const filtered = diaries.filter((d) => d.id !== id)
    storage.love_diaries = filtered
    DemoDataProvider.setStorage(storage)
    return { success: true }
  }
}

export async function addEntriesToDiary(diaryId: string, entryIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await addEntriesToDiaryNeon(diaryId, entryIds)
    return result
  } catch (err: any) {
    const storage = DemoDataProvider.getStorage()
    const diaries: LoveDiary[] = storage.love_diaries || []
    const diary = diaries.find((d) => d.id === diaryId)
    if (diary) {
      const merged = [...new Set([...diary.entry_ids, ...entryIds])]
      diary.entry_ids = merged
      diary.entry_count = merged.length
      storage.love_diaries = diaries
      DemoDataProvider.setStorage(storage)
    }
    return { success: true }
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}