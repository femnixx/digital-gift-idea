import { neon } from '@neondatabase/serverless'
import { resolveConnectionString } from '@/lib/neon/connection'

export function getNeonClient() {
  const connectionString = resolveConnectionString()

  if (!connectionString) {
    throw new Error('Missing database connection string. Add NEON_DATABASE_URL, DATABASE_URL, or DATABASE_URL_UNPOOLED to your environment.')
  }
  return neon(connectionString)
}

export type NeonQueryResult<T> = {
  rows: T[]
  rowCount: number
}