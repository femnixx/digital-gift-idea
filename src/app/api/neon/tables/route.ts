import { NextRequest, NextResponse } from 'next/server'
import { getNeonClient } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const client = getNeonClient()
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')

    if (!table) {
      return NextResponse.json({ error: 'Missing table query parameter' }, { status: 400 })
    }

    const result = await (client as any)`SELECT * FROM ${table} LIMIT 100`
    return NextResponse.json({ table, rows: result })
  } catch (error: any) {
    console.error('Error querying Neon table:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getNeonClient()
    const body = await request.json()
    const { table, values } = body

    if (!table || !values || typeof values !== 'object') {
      return NextResponse.json({ error: 'Missing table or values in request body' }, { status: 400 })
    }

    const keys = Object.keys(values)
    const vals = Object.values(values)
    const result = await (client as any)`INSERT INTO ${table} (${keys}) VALUES (${vals}) RETURNING *`

    return NextResponse.json({ inserted: result }, { status: 201 })
  } catch (error: any) {
    console.error('Error inserting into Neon table:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
