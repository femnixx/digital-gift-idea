import { neon } from '@neondatabase/serverless'

export function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing NEON_DATABASE_URL')
  }
  return neon(connectionString)
}

export type NeonQueryResult<T> = {
  rows: T[]
  rowCount: number
}
