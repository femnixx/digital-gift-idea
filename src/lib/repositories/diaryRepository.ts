import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
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
  if (!isSupabaseConfigured()) {
    return readDemoDiaries()
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return readDemoDiaries()

    const { data, error } = await (supabase as any)
      .from('love_diaries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data) return readDemoDiaries()
    return data as LoveDiary[]
  } catch {
    return readDemoDiaries()
  }
}

export async function getDiaryById(id: string): Promise<LoveDiary | null> {
  if (!isSupabaseConfigured()) {
    return readDemoDiaries().find((d) => d.id === id) || null
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await (supabase as any)
      .from('love_diaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) return null
    return data as LoveDiary
  } catch {
    return null
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

  if (!isSupabaseConfigured()) {
    const storage = DemoDataProvider.getStorage()
    const diaries: LoveDiary[] = storage.love_diaries || []
    diaries.unshift(diary)
    storage.love_diaries = diaries
    DemoDataProvider.setStorage(storage)
    return diary
  }

  try {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('love_diaries')
      .insert({
        user_id: userId,
        title: form.title,
        description: form.description || '',
        entry_ids: form.entry_ids || [],
        cover_image: form.cover_image || null,
      })
      .select()
      .single()

    if (error || !data) return { success: false, error: error?.message || 'Failed to create diary' }
    return data as LoveDiary
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteDiary(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const storage = DemoDataProvider.getStorage()
    const diaries: LoveDiary[] = storage.love_diaries || []
    const filtered = diaries.filter((d) => d.id !== id)
    storage.love_diaries = filtered
    DemoDataProvider.setStorage(storage)
    return { success: true }
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await (supabase as any)
      .from('love_diaries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function addEntriesToDiary(diaryId: string, entryIds: string[]): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
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

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await (supabase as any)
      .from('love_diaries')
      .update({ entry_ids: entryIds })
      .eq('id', diaryId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
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
