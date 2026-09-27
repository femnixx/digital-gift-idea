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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const db = readDB()
    const entry = db.entries.find((e: any) => e.slug === slug && e.is_published)

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching public entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
