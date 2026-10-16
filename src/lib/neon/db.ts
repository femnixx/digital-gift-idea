import { sql } from '@/lib/neon/auth'
import type { Entry, Media } from '@/types'

export async function getEntries() {
  const result = await sql`
    select id, slug, title, type, content, publish_at, unlock_at, unlock_condition, expires_at, edit_token,
           is_published, is_featured, view_count, created_by, created_at, updated_at
    from entries order by created_at desc
  `
  return result as Entry[]
}

export async function getEntryBySlug(slug: string) {
  const result = await sql`
    select id, slug, title, type, content, publish_at, unlock_at, unlock_condition, expires_at, edit_token,
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

export async function createEntry(entry: Omit<Entry, 'id'> & { created_by?: string | null }) {
  const now = new Date().toISOString()
  const result = await sql`
    insert into entries (slug, title, type, content, publish_at, unlock_at, unlock_condition, expires_at, is_published, is_featured, view_count, created_by, created_at, updated_at)
    values (${entry.slug}, ${entry.title}, ${entry.type}, ${entry.content}::jsonb, ${entry.publish_at ?? now}, ${entry.unlock_at}, ${entry.unlock_condition}, ${entry.expires_at ?? null}, ${entry.is_published}, ${entry.is_featured}, ${entry.view_count}, ${entry.created_by ?? null}, ${entry.created_at}, ${entry.updated_at})
    returning id, slug, title, type, content, publish_at, unlock_at, unlock_condition, expires_at, edit_token, is_published, is_featured, view_count, created_by, created_at, updated_at
  `
  return result[0] as Entry
}

export async function updateEntry(id: string, patch: Partial<Entry>) {
  const sets: string[] = []
  const values: any[] = []
  let idx = 0

  const fieldMap: Record<string, string> = {
    title: 'title', slug: 'slug', type: 'type', content: 'content', publish_at: 'publish_at',
    unlock_at: 'unlock_at', unlock_condition: 'unlock_condition', expires_at: 'expires_at',
    is_published: 'is_published', is_featured: 'is_featured', view_count: 'view_count',
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

export async function getMediaById(id: string) {
  const result = await sql`
    select id, entry_id, type, storage_path, public_url, filename, mime_type, size_bytes, width, height, duration_seconds, sort_order, created_at
    from media where id = ${id} limit 1
  `
  return (result[0] as Media) || null
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

export async function getScrapbookItemsByEntry(entryId: string) {
  const pages = await sql`
    select * from scrapbook_pages where entry_id = ${entryId} order by created_at asc
  `
  const pagesResult = pages as any[]

  if (!pagesResult.length) return []

  const allItems = [] as any[]
  for (const page of pagesResult) {
    const items = await sql`
      select * from scrapbook_items where page_id = ${page.id} order by z_index asc, created_at asc
    `
    allItems.push({ ...page, items: items as any[] })
  }
  return allItems
}

export async function createScrapbookPage(page: {
  entry_id: string
  layout_type?: string
  background_color?: string
  background_image?: string | null
}) {
  const result = await sql`
    insert into scrapbook_pages (entry_id, layout_type, background_color, background_image)
    values (
      ${page.entry_id},
      ${page.layout_type || 'freeform'},
      ${page.background_color || '#fdf6f0'},
      ${page.background_image || null}
    )
    returning *
  `
  return result[0] as any
}

export async function createScrapbookItem(item: {
  page_id: string
  media_id?: string | null
  image_url?: string | null
  caption?: string | null
  position_x?: number
  position_y?: number
  width?: number
  height?: number
  rotation?: number
  scale?: number
  z_index?: number
  date_tag?: string | null
  font_family?: string
  font_size?: string
  font_color?: string
  text_alignment?: string
}) {
  const result = await sql`
    insert into scrapbook_items
      (page_id, media_id, image_url, caption, position_x, position_y, width, height, rotation, scale, z_index, date_tag, font_family, font_size, font_color, text_alignment)
    values
      (
        ${item.page_id},
        ${item.media_id || null},
        ${item.image_url || null},
        ${item.caption || null},
        ${item.position_x ?? 0},
        ${item.position_y ?? 0},
        ${item.width ?? 120},
        ${item.height ?? 120},
        ${item.rotation ?? 0},
        ${item.scale ?? 1},
        ${item.z_index ?? 0},
        ${item.date_tag || null},
        ${item.font_family || 'serif'},
        ${item.font_size || '14px'},
        ${item.font_color || '#374151'},
        ${item.text_alignment || 'center'}
      )
    returning *
  `
  return result[0] as any
}

export async function updateScrapbookItem(id: string, entryId: string, patch: Partial<{
  media_id: string | null
  image_url: string | null
  caption: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  rotation: number
  scale: number
  z_index: number
  date_tag: string | null
  font_family: string
  font_size: string
  font_color: string
  text_alignment: string
}>) {
  const sets: string[] = []
  const values: any[] = []
  let idx = 0

  const allowedFields = ['media_id', 'image_url', 'caption', 'position_x', 'position_y', 'width', 'height', 'rotation', 'scale', 'z_index', 'date_tag', 'font_family', 'font_size', 'font_color', 'text_alignment']

  for (const key of allowedFields) {
    if (key in patch) {
      sets.push(`${key} = $${++idx}`)
      values.push((patch as any)[key])
    }
  }
  if (!sets.length) return null

  sets.push(`updated_at = now()`)
  values.push(id, entryId)

  const query = `update scrapbook_items set ${sets.join(', ')} where id = $${++idx} and page_id in (select id from scrapbook_pages where entry_id = $${++idx}) returning *`
  const result = await sql.query(query, values)
  return result[0] || null
}

export async function upsertScrapbookItem(entryId: string, item: any) {
  const pageResult = await sql`select id from scrapbook_pages where entry_id = ${entryId} limit 1`
  let pageId: string

  if (pageResult.length === 0) {
    const page = await createScrapbookPage({ entry_id: entryId })
    pageId = page.id
  } else {
    pageId = pageResult[0].id
  }

  if (item.id) {
    const existing = await sql`select id from scrapbook_items where id = ${item.id} and page_id = ${pageId}`
    if (existing.length) {
      return await updateScrapbookItem(item.id, entryId, item)
    }
  }

  return await createScrapbookItem({
    page_id: pageId,
    media_id: item.media_id || null,
    image_url: item.image_url || null,
    caption: item.caption || null,
    position_x: item.position_x,
    position_y: item.position_y,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
    scale: item.scale,
    z_index: item.z_index,
    date_tag: item.date_tag || null,
    font_family: item.font_family,
    font_size: item.font_size,
    font_color: item.font_color,
    text_alignment: item.text_alignment,
  })
}

export async function updateScrapbookPage(entryId: string, pagePatch: Partial<{
  layout_type: string
  background_color: string
  background_image: string | null
}>, items: any[] | null) {
  const pageResult = await sql`select id from scrapbook_pages where entry_id = ${entryId} limit 1`
  let pageId: string | null = null

  if (pageResult.length) {
    pageId = pageResult[0].id
  } else if (Object.keys(pagePatch).length > 0 || items !== null) {
    const page = await createScrapbookPage({ entry_id: entryId })
    pageId = page.id
  }

  if (pageId && Object.keys(pagePatch).length > 0) {
    const sets: string[] = []
    const values: any[] = []
    let idx = 0
    const allowedFields = ['layout_type', 'background_color', 'background_image']
    for (const key of allowedFields) {
      if (key in pagePatch) {
        sets.push(`${key} = $${++idx}`)
        values.push((pagePatch as any)[key])
      }
    }
    sets.push(`updated_at = now()`)
    values.push(pageId)
    const query = `update scrapbook_pages set ${sets.join(', ')} where id = $${++idx} returning *`
    await sql.query(query, values)
  }

  if (pageId && items !== null) {
    await sql`delete from scrapbook_items where page_id = ${pageId}`
    for (const item of items) {
      await sql`
        insert into scrapbook_items
          (page_id, media_id, image_url, caption, position_x, position_y, width, height, rotation, scale, z_index, date_tag, font_family, font_size, font_color, text_alignment)
        values
          (
            ${pageId},
            ${item.media_id || null},
            ${item.image_url || null},
            ${item.caption || null},
            ${item.position_x ?? 0},
            ${item.position_y ?? 0},
            ${item.width ?? 120},
            ${item.height ?? 120},
            ${item.rotation ?? 0},
            ${item.scale ?? 1},
            ${item.z_index ?? 0},
            ${item.date_tag || null},
            ${item.font_family || 'serif'},
            ${item.font_size || '14px'},
            ${item.font_color || '#374151'},
            ${item.text_alignment || 'center'}
          )
      `
    }
  }

  const result = await sql`
    select sp.*, sitems.items as items
    from scrapbook_pages sp
    left join (
      select page_id, json_agg(si.*) as items
      from scrapbook_items si
      group by page_id
    ) sitems on sitems.page_id = sp.id
    where sp.entry_id = ${entryId}
  `
  return result[0] as any
}

export async function deleteScrapbookItem(itemId: string, entryId: string) {
  await sql`
    delete from scrapbook_items
    where id = ${itemId}
    and page_id in (select id from scrapbook_pages where entry_id = ${entryId})
  `
}

export async function getScrapbookPagesByEntry(entryId: string) {
  const result = await sql`
    select id, entry_id, layout_type, background_color, background_image, created_at, updated_at
    from scrapbook_pages where entry_id = ${entryId} order by created_at asc
  `
  return result as any[]
}

export async function getScrapbookItemsByPage(pageId: string) {
  const result = await sql`
    select * from scrapbook_items where page_id = ${pageId} order by z_index asc, created_at asc
  `
  return result as any[]
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

/**
 * Voice notes with their audio.
 *
 * Joined to media rather than selected alone: voice_notes carries media_id but
 * not the file, and the public page built an empty audio url from the missing
 * join, so a saved note rendered but never played. The media columns are
 * flattened onto the note so existing callers reading note.media keep working.
 */
export async function getVoiceNotesByEntry(entryId: string) {
  const result = await sql`
    select
      v.*,
      m.public_url   as media_public_url,
      m.storage_path as media_storage_path,
      m.mime_type    as media_mime_type,
      m.filename     as media_filename
    from voice_notes v
    left join media m on m.id = v.media_id
    where v.entry_id = ${entryId}
    order by v.created_at
  `

  return (result as any[]).map((note) => ({
    ...note,
    media: note.media_id
      ? {
          id: note.media_id,
          public_url: note.media_public_url,
          storage_path: note.media_storage_path,
          mime_type: note.media_mime_type,
          filename: note.media_filename,
        }
      : null,
  }))
}

export async function createVoiceNote(note: any) {
  const result = await sql`
    insert into voice_notes (entry_id, media_id, title, transcript, waveform_data, duration_seconds, cassette_side)
    values (${note.entry_id}, ${note.media_id || null}, ${note.title}, ${note.transcript || null}, ${note.waveform_data ? JSON.stringify(note.waveform_data) : null}, ${note.duration_seconds || null}, ${note.cassette_side || 'A'})
    returning *
  `
  return result[0]
}

export async function deleteVoiceNote(id: string, entryId: string) {
  await sql`delete from voice_notes where id = ${id} and entry_id = ${entryId}`
}

export async function getBucketListByEntry(entryId: string) {
  const result = await sql`
    select id, entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at
    from bucket_list
    where entry_id = ${entryId}
    order by dream_date asc, sort_order asc
  `
  return result as any[]
}

export async function createBucketListItem(item: {
  entry_id: string
  title: string
  description?: string | null
  dream_date: string
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  media_urls?: string[]
  tags?: string[] | null
  is_achieved?: boolean
  achieved_date?: string | null
  sort_order?: number
}) {
  const now = new Date().toISOString()
  const result = await sql`
    insert into bucket_list (entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at)
    values (
      ${item.entry_id},
      ${item.title},
      ${item.description ?? null},
      ${item.dream_date},
      ${item.location ?? null},
      ${item.latitude ?? null},
      ${item.longitude ?? null},
      ${item.media_urls ?? []},
      ${item.tags ?? null},
      ${item.is_achieved ?? false},
      ${item.achieved_date ?? null},
      ${item.sort_order ?? 0},
      ${now},
      ${now}
    )
    returning id, entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at
  `
  return result[0] as any
}

export async function updateBucketListItem(id: string, entryId: string, patch: Partial<{
  title: string
  description: string | null
  dream_date: string
  location: string | null
  latitude: number | null
  longitude: number | null
  media_urls: string[]
  tags: string[] | null
  is_achieved: boolean
  achieved_date: string | null
  sort_order: number
}>) {
  const sets: string[] = []
  const values: any[] = []
  let idx = 0

  const allowedFields = ['title', 'description', 'dream_date', 'location', 'latitude', 'longitude', 'media_urls', 'tags', 'is_achieved', 'achieved_date', 'sort_order']

  for (const key of allowedFields) {
    if (key in patch) {
      sets.push(`${key} = $${++idx}`)
      values.push((patch as any)[key])
    }
  }
  if (!sets.length) return null

  values.push(entryId, id)
  const query = `update bucket_list set ${sets.join(', ')}, updated_at = now() where id = $${++idx} and entry_id = $${++idx} returning id, entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at`
  const result = await sql.query(query, values)
  return result[0] || null
}

export async function deleteBucketListItem(id: string, entryId: string) {
  await sql`delete from bucket_list where id = ${id} and entry_id = ${entryId}`
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
