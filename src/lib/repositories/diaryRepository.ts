import { getNeonClient } from '@/lib/neon'

export type DiaryRow = {
  id: string
  user_id: string
  title: string
  description?: string
  entry_ids: string[]
  cover_image?: string | null
  created_at: string
  updated_at: string
}

export async function createDiary(form: { title: string; description?: string; entry_ids?: string[]; cover_image?: string }, userId: string): Promise<{ success: boolean; data?: DiaryRow; error?: string }> {
  const client = getNeonClient()
  try {
    const result = await (client as any).query(
      `INSERT INTO love_diaries (user_id, title, description, entry_ids, cover_image)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, form.title, form.description || '', form.entry_ids || [], form.cover_image || null]
    )
    return { success: true, data: result.rows[0] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getDiariesByUserId(userId: string): Promise<DiaryRow[]> {
  const client = getNeonClient()
  const result = await (client as any).query(`SELECT * FROM love_diaries WHERE user_id = $1 ORDER BY updated_at DESC`, [userId])
  return result.rows
}

export async function getDiaryById(id: string): Promise<DiaryRow | null> {
  const client = getNeonClient()
  const result = await (client as any).query(`SELECT * FROM love_diaries WHERE id = $1 LIMIT 1`, [id])
  return result.rows[0] || null
}

export async function updateDiary(id: string, data: Partial<DiaryRow>): Promise<DiaryRow | null> {
  const client = getNeonClient()
  const fields: string[] = []
  const params: any[] = []
  let idx = 1

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue
    fields.push(`${key} = $${idx++}`)
    params.push(value)
  }

  if (fields.length === 0) {
    return getDiaryById(id)
  }

  params.push(id)
  const result = await (client as any).query(`UPDATE love_diaries SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params)
  return result.rows[0] || null
}

export async function deleteDiary(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getNeonClient()
  const result = await (client as any).query(`DELETE FROM love_diaries WHERE id = $1`, [id])
  return { success: result.rowCount > 0 }
}

export async function getDiaries(): Promise<DiaryRow[]> {
  const client = getNeonClient()
  const result = await (client as any).query(`SELECT * FROM love_diaries ORDER BY updated_at DESC`)
  return result.rows
}

export async function addEntriesToDiary(diaryId: string, entryIds: string[]): Promise<{ success: boolean; error?: string }> {
  const client = getNeonClient()
  const diary = await getDiaryById(diaryId)
  if (!diary) {
    return { success: false, error: 'Diary not found' }
  }
  const existingIds = new Set(diary.entry_ids || [])
  for (const id of entryIds) {
    existingIds.add(id)
  }
  const result = await (client as any).query(
    `UPDATE love_diaries SET entry_ids = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [Array.from(existingIds), diaryId]
  )
  return { success: !!result.rows[0] }
}
