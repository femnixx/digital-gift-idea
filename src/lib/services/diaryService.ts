import type { LoveDiary, LoveDiaryWithMetrics, CreateDiaryForm } from '@/types'

export async function listDiaries(): Promise<LoveDiary[]> {
  return []
}

export async function loadDiaryById(_id: string): Promise<LoveDiary | null> {
  return null
}

export async function createNewDiary(_form: CreateDiaryForm, _userId: string): Promise<LoveDiary | { success: false; error: string }> {
  return { success: false, error: 'Not implemented' }
}

export async function removeDiary(_id: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented' }
}

export async function attachEntriesToDiary(_diaryId: string, _entryIds: string[]): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented' }
}

export async function getDiaryWithMetrics(_id: string): Promise<LoveDiaryWithMetrics | null> {
  return null
}

export async function getDiaryMetrics(_id: string): Promise<{
  entry_count: number
  total_views: number
  published_count: number
  draft_count: number
  type_breakdown: Record<string, number>
}> {
  return { entry_count: 0, total_views: 0, published_count: 0, draft_count: 0, type_breakdown: {} }
}
