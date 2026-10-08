'use server'

import { sql } from '@/lib/neon/auth'
import type { Entry, Media } from '@/types'

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

export async function getPublishedEntries(limit = 100, offset = 0) {
  const result = await sql`
    select id, slug, title, type, content, publish_at, is_published, is_featured, view_count, created_by, created_at, updated_at
    from entries
    where is_published = true and publish_at <= now()
    order by publish_at desc
    limit ${limit} offset ${offset}
  `
  return result as Entry[]
}

export async function createEntry(entry: Omit<Entry, 'id'> & { created_by?: string }) {
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
  const query = `update entries set ${sets.join(', ')}, updated_at = now() where id = $${++idx} returning id, slug, title, type, content, publish_at, unlock_at, unlock_condition, is_published, is_featured, view_count, created_by, created_at, updated_at`
  const result = await sql.query(query, values)
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

export async function getBouquetFlowersByEntry(entryId: string) {
  const result = await sql`select * from bouquet_flowers where entry_id = ${entryId} order by sort_order`
  return result as any[]
}

export async function createBouquetFlower(flower: any) {
  const result = await sql`
    insert into bouquet_flowers (entry_id, flower_type, color, note, position_x, position_y, rotation, scale, sort_order, generation_seed)
    values (${flower.entry_id}, ${flower.flower_type}, ${flower.color}, ${flower.note || null}, ${flower.position_x || 50}, ${flower.position_y || 50}, ${flower.rotation || 0}, ${flower.scale || 1.0}, ${flower.sort_order || 0}, ${flower.generation_seed || null})
    returning *
  `
  return result[0]
}

export async function getPolaroidCardsByEntry(entryId: string) {
  const result = await sql`select * from polaroid_cards where entry_id = ${entryId} order by sort_order`
  return result as any[]
}

export async function createPolaroidCard(card: any) {
  const result = await sql`
    insert into polaroid_cards (entry_id, image_url, caption, date_tag, back_note, hidden_message, tilt_degrees, sort_order, template, orientation, font_family, font_size, font_color, text_alignment, stickers)
    values (${card.entry_id}, ${card.image_url}, ${card.caption || null}, ${card.date_tag || null}, ${card.back_note || null}, ${card.hidden_message || null}, ${card.tilt_degrees || 0}, ${card.sort_order || 0}, ${card.template || 'classic_white'}, ${card.orientation || 'portrait'}, ${card.font_family || 'sans-serif'}, ${card.font_size || '16px'}, ${card.font_color || '#000000'}, ${card.text_alignment || 'center'}, ${card.stickers || []})
    returning *
  `
  return result[0]
}

export async function getScratchCardsByEntry(entryId: string) {
  const result = await sql`select * from scratch_cards where entry_id = ${entryId}`
  return result as any[]
}

export async function createScratchCard(card: any) {
  const result = await sql`
    insert into scratch_cards (entry_id, cover_color, cover_image_url, reveal_content, scratch_threshold)
    values (${card.entry_id}, ${card.cover_color || '#E8B4B8'}, ${card.cover_image_url || null}, ${card.reveal_content || {}}, ${card.scratch_threshold || 0.6})
    returning *
  `
  return result[0]
}

export async function getOpenWhenLettersByEntry(entryId: string) {
  const result = await sql`select * from open_when_letters where entry_id = ${entryId} order by sort_order`
  return result as any[]
}

export async function createOpenWhenLetter(letter: any) {
  const result = await sql`
    insert into open_when_letters (entry_id, trigger_label, trigger_type, trigger_value, envelope_color, seal_emoji, content, is_unlocked, unlocked_at, sort_order)
    values (${letter.entry_id}, ${letter.trigger_label}, ${letter.trigger_type}, ${letter.trigger_value || null}, ${letter.envelope_color || '#F5E6E8'}, ${letter.seal_emoji || '💌'}, ${letter.content || {}}, ${letter.is_unlocked || false}, ${letter.unlocked_at || null}, ${letter.sort_order || 0})
    returning *
  `
  return result[0]
}

export async function getCoffeeDatesByEntry(entryId: string) {
  const result = await sql`select * from coffee_dates where entry_id = ${entryId}`
  return result as any[]
}

export async function createCoffeeDate(coffeeDate: any) {
  const result = await sql`
    insert into coffee_dates (entry_id, drink_types, custom_name, message, gift_card_url, local_cafe_suggestion, animation_triggered)
    values (${coffeeDate.entry_id}, ${coffeeDate.drink_types || []}, ${coffeeDate.custom_name || null}, ${coffeeDate.message || null}, ${coffeeDate.gift_card_url || null}, ${coffeeDate.local_cafe_suggestion || null}, ${coffeeDate.animation_triggered || false})
    returning *
  `
  return result[0]
}

export async function getVoiceNotesByEntry(entryId: string) {
  const result = await sql`select * from voice_notes where entry_id = ${entryId} order by created_at`
  return result as any[]
}

export async function createVoiceNote(note: any) {
  const result = await sql`
    insert into voice_notes (entry_id, media_id, title, transcript, waveform_data, duration_seconds, cassette_side)
    values (${note.entry_id}, ${note.media_id || null}, ${note.title}, ${note.transcript || null}, ${note.waveform_data || null}, ${note.duration_seconds || null}, ${note.cassette_side || 'A'})
    returning *
  `
  return result[0]
}

export async function deleteVoiceNote(id: string, entryId: string) {
  await sql`delete from voice_notes where id = ${id} and entry_id = ${entryId}`
}

export async function getDiaries(userId: string) {
  const result = await sql`select * from love_diaries where user_id = ${userId} order by created_at desc`
  return result as any[]
}

export async function getDiaryById(id: string) {
  const result = await sql`select * from love_diaries where id = ${id} limit 1`
  return (result[0] || null) as any
}

export async function createDiary(diary: any) {
  const result = await sql`
    insert into love_diaries (user_id, title, description, entry_ids, cover_image)
    values (${diary.user_id}, ${diary.title}, ${diary.description || ''}, ${diary.entry_ids || []}, ${diary.cover_image || null})
    returning *
  `
  return result[0]
}

export async function updateDiary(id: string, patch: any) {
  const sets: string[] = []
  const values: any[] = []
  let idx = 0

  const fieldMap: Record<string, string> = {
    title: 'title', description: 'description', entry_ids: 'entry_ids', cover_image: 'cover_image',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in patch) {
      sets.push(`${col} = $${++idx}`)
      values.push(patch[key])
    }
  }
  if (!sets.length) return null

  values.push(id)
  const query = `update love_diaries set ${sets.join(', ')}, updated_at = now() where id = $${++idx} returning *`
  const result = await sql.query(query, values)
  return result[0] || null
}

export async function deleteDiary(id: string) {
  await sql`delete from love_diaries where id = ${id}`
}

export async function getProfiles() {
  const result = await sql`select id, display_name, created_at, updated_at from profiles order by created_at desc`
  return result as any[]
}

export async function ensureProfileExists(userId: string, displayName: string) {
  try {
    await sql`insert into profiles (id, display_name, created_at, updated_at) values (${userId}, ${displayName}, now(), now())`
  } catch {
    // ignore duplicate
  }
}

export async function getPartnerInteractionsByEntry(entryId: string) {
  const result = await sql`select * from partner_interactions where entry_id = ${entryId} order by created_at desc`
  return result as any[]
}

export async function createPartnerInteraction(interaction: any) {
  const result = await sql`
    insert into partner_interactions (entry_id, interaction_type, metadata)
    values (${interaction.entry_id}, ${interaction.interaction_type}, ${interaction.metadata || {}})
    returning *
  `
  return result[0]
}

export async function addEntriesToDiary(diaryId: string, entryIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`update love_diaries set entry_ids = ${entryIds} where id = ${diaryId}`
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getDiaryWithMetrics(id: string) {
  const diary = await getDiaryById(id)
  if (!diary) return null
  return diary
}

export async function getDiaryMetrics(id: string) {
  const diary = await getDiaryById(id)
  if (!diary) {
    return { entry_count: 0, total_views: 0, published_count: 0, draft_count: 0, type_breakdown: {} }
  }
  return {
    entry_count: diary.entry_ids?.length || 0,
    total_views: 0,
    published_count: 0,
    draft_count: 0,
    type_breakdown: {},
  }
}
