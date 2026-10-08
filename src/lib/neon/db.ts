'use server'

import { sql } from '@/lib/neon/auth'
import type { Entry, Media, User } from '@/types'

export async function getEntries() {
  const result = await sql`
    select id, slug, title, type, content, publish_at, unlock_at, unlock_condition,
           is_published, is_featured, view_count, created_by, created_at, updated_at
    from entries order by created_at desc
  `
  return result as Entry[]
}

export async function getEntryBySlug(slug: string) {
  const result = await sql`
    select id, slug, title, type, content, publish_at, unlock_at, unlock_condition,
           is_published, is_featured, view_count, created_by, created_at, updated_at
    from entries where slug = ${slug} limit 1
  `
  return (result[0] as Entry) || null
}

export async function getEntriesByType(type: string) {
  const result = await sql`
    select id, slug, title, type, content, publish_at, is_published, is_featured, view_count, created_by, created_at, updated_at
    from entries where type = ${type} order by created_at desc
  `
  return result as Entry[]
}

export async function createEntry(entry: Entry & { created_by?: string }) {
  const result = await sql`
    insert into entries (slug, title, type, content, publish_at, unlock_at, unlock_condition, is_published, is_featured, view_count, created_by, created_at, updated_at)
    values (${entry.slug}, ${entry.title}, ${entry.type}, ${entry.content}::jsonb, ${entry.publish_at}, ${entry.unlock_at}, ${entry.unlock_condition}, ${entry.is_published}, ${entry.is_featured}, ${entry.view_count}, ${entry.created_by || null}, ${entry.created_at}, ${entry.updated_at})
    returning id, slug, title, type, content, publish_at, unlock_at, unlock_condition, is_published, is_featured, view_count, created_by, created_at, updated_at
  `
  return result[0] as Entry
}

export async function updateEntry(id: string, patch: Partial<Entry>) {
  const sets: string[] = []
  const values: any[] = []
  let idx = 0

  const fieldMap: Record<string, string> = {
    title: 'title', slug: 'slug', type: 'type', content: 'content', publish_at: 'publish_at',
    unlock_at: 'unlock_at', unlock_condition: 'unlock_condition', is_published: 'is_published',
    is_featured: 'is_featured', view_count: 'view_count',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in patch) {
      sets.push(`${col} = $${++idx}`)
      values.push((patch as any)[key])
    }
  }
  if (!sets.length) return null

  values.push(id)
  const result = await sql.unsafe(
    `update entries set ${sets.join(', ')}, updated_at = now() where id = $${++idx} returning id, slug, title, type, content, publish_at, unlock_at, unlock_condition, is_published, is_featured, view_count, created_by, created_at, updated_at`,
    values
  )
  return result[0] as Entry || null
}

export async function deleteEntry(id: string) {
  await sql`delete from entries where id = ${id}`
}

export async function getMediaByEntry(entryId: string) {
  const result = await sql`
    select id, entry_id, type, storage_path, public_url, filename, mime_type, size_bytes, width, height, duration_seconds, sort_order, created_at
    from media where entry_id = ${entryId} order by sort_order
  `
  return result as Media[]
}

export async function createMedia(media: Partial<Media> & { entry_id: string }) {
  const result = await sql`
    insert into media (entry_id, type, storage_path, public_url, filename, mime_type, size_bytes, width, height, duration_seconds, sort_order)
    values (${media.entry_id}, ${media.type}, ${media.storage_path}, ${media.public_url}, ${media.filename}, ${media.mime_type}, ${media.size_bytes || null}, ${media.width || null}, ${media.height || null}, ${media.duration_seconds || null}, ${media.sort_order || 0})
    returning *
  `
  return result[0] as Media
}

export async function deleteMedia(id: string) {
  await sql`delete from media where id = ${id}`
}