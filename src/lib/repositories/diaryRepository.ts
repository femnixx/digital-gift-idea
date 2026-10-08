'use client'

import type { LoveDiary, CreateDiaryForm } from '@/types'

export async function getDiaries(): Promise<LoveDiary[]> {
  return []
}

export async function getDiaryById(_id: string): Promise<LoveDiary | null> {
  return null
}

export async function createDiary(_form: CreateDiaryForm, _userId: string): Promise<LoveDiary | { success: false; error: string }> {
  return { success: false, error: 'Not implemented' }
}

export async function deleteDiary(_id: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented' }
}

export async function addEntriesToDiary(_diaryId: string, _entryIds: string[]): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented' }
}
