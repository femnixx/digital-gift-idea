import { NextRequest, NextResponse } from 'next/server'
import {
  getDiaryById,
  createDiary,
  deleteDiary,
  addEntriesToDiary,
} from '@/lib/repositories/diaryRepository'
import { getDiaryWithMetrics, getDiaryMetrics } from '@/lib/services/diaryService'
import { createClient } from '@/lib/supabase/server'
import type { LoveDiary, CreateDiaryForm } from '@/types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const diary = await getDiaryById(id)
    if (!diary) return NextResponse.json({ error: 'Diary not found' }, { status: 404 })
    if (diary.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ data: diary })
  } catch (error) {
    console.error('Error fetching diary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const diary = await getDiaryById(id)
    if (!diary) return NextResponse.json({ error: 'Diary not found' }, { status: 404 })
    if (diary.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const result = await deleteDiary(id)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting diary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { entry_ids } = body

    if (!entry_ids || !Array.isArray(entry_ids)) {
      return NextResponse.json({ error: 'entry_ids must be an array' }, { status: 400 })
    }

    const diary = await getDiaryById(id)
    if (!diary) return NextResponse.json({ error: 'Diary not found' }, { status: 404 })
    if (diary.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const result = await addEntriesToDiary(id, entry_ids)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating diary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const diary = await getDiaryById(id)
    if (!diary) return NextResponse.json({ error: 'Diary not found' }, { status: 404 })
    if (diary.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'metrics') {
      const metrics = await getDiaryMetrics(id)
      return NextResponse.json({ data: metrics })
    }

    if (action === 'with-metrics') {
      const withMetrics = await getDiaryWithMetrics(id)
      return NextResponse.json({ data: withMetrics })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing diary action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
