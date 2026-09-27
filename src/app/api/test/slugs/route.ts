import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), '.tmp', 'test-slugs-db.json')

function readDB() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
    }
  } catch {}
  return { entries: [], media: [], profiles: [] }
}

function writeDB(data: any) {
  const dir = path.dirname(STORAGE_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
}

export async function GET(request: NextRequest) {
  try {
    const db = readDB()
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')

    let entries = db.entries || []

    if (published !== null) {
      entries = entries.filter((e: any) => e.is_published === (published === 'true'))
    }

    entries = entries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      entries: entries.map((e: any) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        type: e.type,
        is_published: e.is_published,
        publish_at: e.publish_at,
        created_at: e.created_at
      }))
    })
  } catch (error) {
    console.error('Error listing slugs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, slug, content, publish_at, is_published } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    const db = readDB()
    const existing = db.entries.find((e: any) => e.slug === slug)

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    const entry = {
      id: `test-${Date.now()}`,
      slug,
      title,
      type: type || 'letter',
      content: content || {},
      publish_at: publish_at || new Date().toISOString(),
      is_published: is_published ?? true,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    db.entries = [entry, ...(db.entries || [])]
    writeDB(db)

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
