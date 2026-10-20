'use server'

import { sql } from '@/lib/db'
import { customAlphabet } from 'nanoid'
import bcrypt from 'bcryptjs'

type SqlRow = Record<string, any>

const autoSlug = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 12)

const RESERVED_SLUGS = new Set([
  'admin','api','login','logout','signup','signin','dashboard',
  'g','gift','gifts','drawer','reply','publish','unpublish',
  'settings','account','profile','about','contact','privacy',
  'terms','sitemap','robots','favicon','opengraph','og',
  'report','delete','auth','session','checkout','stripe',
  'health','status','widget','embed','assets','static',
  'images','fonts','graphql','rest','webhook',
])

export type GiftType =
  | 'letter' | 'memory_book' | 'coupons' | 'reasons' | 'mixtape'
  | 'open_when' | 'countdown' | 'quiz' | 'hunt' | 'date_jar'

export interface CreateGiftInput {
  type: GiftType
  title: string
  recipient_name?: string | null
  note?: string | null
  wrap_style?: string
  items: Array<{ kind: string; payload_json: Record<string, unknown>; position: number }>
  custom_slug?: string
  pin?: string | null
  unlock_at?: string | null
}

export async function createGift(input: CreateGiftInput) {
  const s = sql()
  const slug = input.custom_slug?.trim() || autoSlug()

  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false as const, error: 'reserved_slug' as const }
  }

  let pinHash: string | null = null
  if (input.pin) {
    pinHash = await bcrypt.hash(input.pin, 10)
  }

  const result = await s`
    insert into gifts (type, title, recipient_name, note, wrap_style, slug, slug_is_custom, pin_hash, unlock_at, status)
    values (
      ${input.type}, ${input.title}, ${input.recipient_name || null}, ${input.note || null},
      ${input.wrap_style || 'airmail'}, ${slug}, ${!!input.custom_slug},
      ${pinHash}, ${input.unlock_at || null}, 'draft'
    )
    returning id, slug, status, unlock_at
  ` as unknown as SqlRow[]
  const gift = result[0]

  for (const item of input.items) {
    await s`
      insert into gift_items (gift_id, kind, position, payload_json)
      values (${gift.id}, ${item.kind}, ${item.position}, ${JSON.stringify(item.payload_json)})
    `
  }

  return { ok: true as const, gift: { id: gift.id, slug: gift.slug, status: gift.status, unlock_at: gift.unlock_at } }
}

export async function checkSlugAvailability(slug: string) {
  const s = sql()
  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, status: 'reserved' as const }
  }
  const result = await s`select id from gifts where slug = ${slug}` as unknown as SqlRow[]
  if (result[0]) {
    return { available: false, status: 'taken' as const }
  }
  return { available: true, status: 'available' as const }
}

export async function publishGift(giftId: string, customSlug?: string) {
  const s = sql()
  const slug = customSlug?.trim() || autoSlug()

  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false as const, error: 'reserved_slug' as const }
  }

  try {
    const result = await s`
      update gifts
      set status = 'published', slug = ${slug}, slug_is_custom = ${!!customSlug},
          published_at = now(), updated_at = now()
      where id = ${giftId} and status <> 'published'
      returning id, slug
    ` as unknown as SqlRow[]
    const row = result[0]
    return { ok: true as const, slug: row.slug }
  } catch (e: any) {
    if (e?.code === '23505') {
      return { ok: false as const, error: 'slug_taken' as const }
    }
    throw e
  }
}

export async function getGiftBySlug(slug: string) {
  const s = sql()
  const result = await s`
    select id, type, title, recipient_name, note, wrap_style, status, slug,
           slug_is_custom, pin_hash, unlock_at, indexable, published_at,
           created_at, updated_at
    from gifts where slug = ${slug}
  ` as unknown as SqlRow[]
  const gift = result[0]
  if (!gift) return null

  const items = await s`
    select id, kind, position, payload_json, unlock_at
    from gift_items where gift_id = ${gift.id}
    order by position asc
  ` as unknown as SqlRow[]

  return { ...gift, items }
}

export async function verifyPIN(giftId: string, pin: string) {
  const s = sql()
  const result = await s`
    select id, pin_hash from gifts where id = ${giftId}
  ` as unknown as SqlRow[]
  const gift = result[0]
  if (!gift || !gift.pin_hash) return { ok: false as const, error: 'no_pin' as const }

  const valid = await bcrypt.compare(pin, gift.pin_hash)
  return { ok: valid }
}

export async function recordReveal(giftId: string, visitorId: string) {
  const s = sql()
  await s`
    insert into reveals (gift_id, visitor_id)
    values (${giftId}, ${visitorId})
  `
}

export async function addReaction(giftItemId: string, visitorId: string, stamp: string) {
  const s = sql()
  await s`
    insert into reactions (gift_item_id, visitor_id, stamp)
    values (${giftItemId}, ${visitorId}, ${stamp})
    on conflict (gift_item_id, visitor_id) do update set stamp = excluded.stamp
  `
}

export async function addReply(giftId: string, message: string, mediaUrl?: string | null) {
  const s = sql()
  await s`
    insert into replies (gift_id, message, media_url)
    values (${giftId}, ${message}, ${mediaUrl || null})
  `
}

export async function addContribution(giftId: string, authorName: string, message: string, mediaUrl?: string | null) {
  const s = sql()
  await s`
    insert into contributions (gift_id, author_name, message, media_url, approved)
    values (${giftId}, ${authorName}, ${message}, ${mediaUrl || null}, false)
  `
}

export async function isGiftUnlocked(gift: { unlock_at: string | null; status: string }) {
  if (gift.status !== 'published') return false
  if (!gift.unlock_at) return true
  return new Date(gift.unlock_at) <= new Date()
}

export async function getPinAttempts(giftId: string, visitorId: string) {
  const s = sql()
  const result = await s`
    select count(*) as count from pin_attempts
    where gift_id = ${giftId} and visitor_id = ${visitorId}
      and attempted_at > now() - interval '10 minutes'
  ` as unknown as SqlRow[]
  return Number(result[0]?.count || 0)
}

export async function recordPinAttempt(giftId: string, visitorId: string) {
  const s = sql()
  await s`
    insert into pin_attempts (gift_id, visitor_id)
    values (${giftId}, ${visitorId})
  `
}
