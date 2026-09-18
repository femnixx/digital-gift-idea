import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getDiaries, getDiaryById, createDiary, deleteDiary } from '@/lib/repositories/diaryRepository'
import type { CreateDiaryForm } from '@/types'

const createDiarySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  entry_ids: z.array(z.string().uuid()).optional(),
  cover_image: z.string().url().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const diary = await getDiaryById(id)
      if (!diary) return NextResponse.json({ error: 'Diary not found' }, { status: 404 })
      if (diary.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.json({ data: diary })
    }

    const diaries = await getDiaries()
    const userDiaries = diaries.filter((d) => d.user_id === user.id)
    return NextResponse.json({ data: userDiaries })
  } catch (error) {
    console.error('Error fetching diaries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createDiarySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const diaryForm: CreateDiaryForm = {
      title: validation.data.title,
      description: validation.data.description || '',
      entry_ids: validation.data.entry_ids || [],
    }
    if (validation.data.cover_image) {
      diaryForm.cover_image = validation.data.cover_image
    }

    const result = await createDiary(diaryForm, user.id)

    if ('success' in result && !result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ data: result })
  } catch (err: any) {
    console.error('Error creating diary:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const diary = await getDiaryById(id)
    if (!diary) return NextResponse.json({ error: 'Diary not found' }, { status: 404 })
    if (diary.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const result = await deleteDiary(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting diary:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
