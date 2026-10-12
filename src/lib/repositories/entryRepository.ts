import { sql } from '@/lib/neon/auth'
import { getEntryBySlug } from '@/lib/neon/db'
import type { Entry } from '@/types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Upper bound on a single page of entries, so a caller cannot request an unbounded result set. */
const MAX_PAGE_LIMIT = 100
const DEFAULT_PAGE_LIMIT = 10

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

/**
 * Resolve an entry by id or slug, verifying the entry actually exists.
 * This is the single shared resolver for slug-vs-UUID identifiers.
 */
export async function resolveEntryByIdOrSlug(identifier: string) {
  if (isUuid(identifier)) {
    const result = await sql`
      select id, slug, title, type, content, publish_at, unlock_at, unlock_condition,
             is_published, is_featured, view_count, created_by, created_at, updated_at
      from entries where id = ${identifier} limit 1
    `
    return (result[0] as Entry) || null
  }

  return getEntryBySlug(identifier)
}

export async function slugExists(slug: string, excludeId?: string) {
  const result = excludeId
    ? await sql`select id from entries where slug = ${slug} and id != ${excludeId} limit 1`
    : await sql`select id from entries where slug = ${slug} limit 1`
  return result.length > 0
}

export interface EntryListFilters {
  created_by?: string
  type?: string
  search?: string
}

function buildEntryFilters(filters: EntryListFilters) {
  // Every interpolated value below is bound as a parameter by the Neon driver,
  // never concatenated into the SQL text. The base is the boolean literal so the
  // composed fragment is a valid `where` predicate with or without more filters.
  let query = sql`true`
  if (filters.created_by) {
    query = sql`${query} and created_by = ${filters.created_by}`
  }
  if (filters.type) {
    query = sql`${query} and type = ${filters.type}`
  }
  if (filters.search) {
    const pattern = `%${filters.search}%`
    query = sql`${query} and (title ilike ${pattern} or slug ilike ${pattern})`
  }
  return query
}

/**
 * Clamp caller-supplied pagination. `parseInt('abc')` yields NaN and negative or
 * huge page sizes would otherwise reach the SQL as `LIMIT NaN` / a negative
 * OFFSET, both of which Postgres rejects with a 500.
 */
function sanitizePagination(page?: number, limit?: number) {
  const safePage = Number.isFinite(page) ? Math.max(Math.floor(page as number), 1) : 1
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit as number), 1), MAX_PAGE_LIMIT)
    : DEFAULT_PAGE_LIMIT
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit }
}

export async function listEntries(params: EntryListFilters & { page?: number; limit?: number }) {
  const { limit, offset } = sanitizePagination(params.page, params.limit)
  const filters = buildEntryFilters(params)

  const result = await sql`
    select id, slug, title, type, content, publish_at, unlock_at, unlock_condition,
           is_published, is_featured, view_count, created_by, created_at, updated_at
    from entries
    where ${filters}
    order by created_at desc
    limit ${limit} offset ${offset}
  `
  return result as Entry[]
}

export async function countEntries(params: EntryListFilters) {
  const filters = buildEntryFilters(params)
  const result = await sql`
    select count(*)::int as total from entries where ${filters}
  `
  return (result[0] as { total: number } | undefined)?.total ?? 0
}

export {
  createEntry,
  updateEntry,
  deleteEntry,
} from '../neon/db'
