import type { LoveDiary, LoveDiaryWithMetrics, CreateDiaryForm } from '@/types'
import {
  getDiaries,
  getDiaryById,
  createDiary,
  deleteDiary,
  addEntriesToDiary,
} from '@/lib/repositories/diaryRepository'
import type { Entry } from '@/types'

export async function listDiaries(): Promise<LoveDiary[]> {
  const diaries = await getDiaries()
  return diaries.map(d => ({
    ...d,
    description: d.description || '',
    cover_image: d.cover_image ?? null,
    entry_count: d.entry_ids?.length || 0,
    total_views: 0,
  }))
}

export async function loadDiaryById(id: string): Promise<LoveDiary | null> {
  const diary = await getDiaryById(id)
  if (!diary) return null
  return {
    ...diary,
    description: diary.description || '',
    cover_image: diary.cover_image ?? null,
    entry_count: diary.entry_ids?.length || 0,
    total_views: 0,
  }
}

export async function createNewDiary(form: CreateDiaryForm, userId: string): Promise<LoveDiary | { success: false; error: string }> {
  if (!form.title.trim()) {
    return { success: false, error: 'Diary title is required' }
  }
  if (form.title.length > 200) {
    return { success: false, error: 'Title must be under 200 characters' }
  }
  if (form.description && form.description.length > 2000) {
    return { success: false, error: 'Description must be under 2000 characters' }
  }
  const result = await createDiary(form, userId)
  if (!result.success || !result.data) {
    return { success: false, error: result.error || 'Failed to create diary' }
  }
  const diary = result.data
  return {
    ...diary,
    description: diary.description || '',
    cover_image: diary.cover_image ?? null,
    entry_count: diary.entry_ids?.length || 0,
    total_views: 0,
  }
}

export async function removeDiary(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteDiary(id)
}

export async function attachEntriesToDiary(diaryId: string, entryIds: string[]): Promise<{ success: boolean; error?: string }> {
  return addEntriesToDiary(diaryId, entryIds)
}

export async function getDiaryWithMetrics(id: string): Promise<LoveDiaryWithMetrics | null> {
  const diary = await getDiaryById(id)
  if (!diary) return null

  let entriesDetail: LoveDiaryWithMetrics['entries_detail'] = []

  try {
    const raw = localStorage.getItem('digital-love-letters-demo')
    if (raw) {
      const data = JSON.parse(raw)
      const allEntries: Entry[] = data.entries || []
      entriesDetail = allEntries
        .filter((e) => diary.entry_ids.includes(e.id))
        .map((e) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          type: e.type,
          is_published: e.is_published,
          view_count: e.view_count || 0,
          created_at: e.created_at,
        }))
    }
  } catch {}

  const totalViews = entriesDetail.reduce((sum, e) => sum + e.view_count, 0)

  return {
    ...diary,
    description: diary.description || '',
    cover_image: diary.cover_image ?? null,
    entry_count: diary.entry_ids?.length || 0,
    total_views: totalViews,
    entries_detail: entriesDetail,
  }
}

export async function getDiaryMetrics(id: string): Promise<{
  entry_count: number
  total_views: number
  published_count: number
  draft_count: number
  type_breakdown: Record<string, number>
}> {
  const diary = await getDiaryById(id)
  if (!diary) {
    return { entry_count: 0, total_views: 0, published_count: 0, draft_count: 0, type_breakdown: {} }
  }

  let published = 0
  let drafts = 0
  const typeBreakdown: Record<string, number> = {}
  let totalViews = 0

  try {
    const raw = localStorage.getItem('digital-love-letters-demo')
    if (raw) {
      const data = JSON.parse(raw)
      const allEntries: Entry[] = data.entries || []
      const relevant = allEntries.filter((e) => diary.entry_ids.includes(e.id))

      relevant.forEach((e) => {
        if (e.is_published) published++
        else drafts++
        typeBreakdown[e.type] = (typeBreakdown[e.type] || 0) + 1
        totalViews += e.view_count || 0
      })
    }
  } catch {}

  return {
    entry_count: diary.entry_ids?.length || 0,
    total_views: totalViews,
    published_count: published,
    draft_count: drafts,
    type_breakdown: typeBreakdown,
  }
}
