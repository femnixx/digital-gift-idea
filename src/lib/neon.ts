import { neon } from '@neondatabase/serverless'

export function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    throw new Error('Missing NEON_DATABASE_URL. Add it to your environment to use Neon table operations.')
  }

  return neon(connectionString)
}

export type NeonQueryResult<T> = {
  rows: T[]
  rowCount: number
}
