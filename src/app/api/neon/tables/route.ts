import { NextRequest, NextResponse } from 'next/server'
import { getNeonClient } from '@/lib/neon'

function sanitizeIdentifier(value: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error('Invalid identifier')
  }
  return value
}

export async function GET(request: NextRequest) {
  try {
    const client = getNeonClient()
    const { searchParams } = new URL(request.url)
    const rawTable = searchParams.get('table')

    if (!rawTable) {
      return NextResponse.json({ error: 'Missing table query parameter' }, { status: 400 })
    }

    const table = sanitizeIdentifier(rawTable)
    const result = await (client as any).query(`SELECT * FROM ${table} LIMIT 100`)
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

    const sanitizedTable = sanitizeIdentifier(table)
    const keys = Object.keys(values)
    const vals = Object.values(values)
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ')

    const result = await (client as any).query(
      `INSERT INTO ${sanitizedTable} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    )

    return NextResponse.json({ inserted: result }, { status: 201 })
  } catch (error: any) {
    console.error('Error inserting into Neon table:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
