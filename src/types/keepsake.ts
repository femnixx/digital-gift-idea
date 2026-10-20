/* ============================================================================
   KEEPSAKE data model types
   ============================================================================ */

export type KeepsakeGiftType =
  | 'letter'
  | 'memory_book'
  | 'coupon_booklet'
  | 'reasons'
  | 'mixtape'

export type WrapPaper = 'parchment' | 'ruled' | 'vellum' | 'graph' | 'pressed_flower'
export type WrapRibbon = 'satin' | 'grosgrain' | 'lace' | 'leather_cord'
export type WrapSeal = 'wax' | 'sticker' | 'string' | 'none'

export interface WrapStyle {
  paper: WrapPaper
  ribbon: WrapRibbon
  seal: WrapSeal
  tagText: string
}

export interface KeepsakeGift {
  id: string
  slug: string
  slug_is_custom: boolean
  title: string
  recipient_name: string | null
  type: KeepsakeGiftType
  note: string | null
  wrap_style: WrapStyle | null
  unlock_at: string | null
  pin_hash: string | null
  status: 'draft' | 'published' | 'unpublished' | 'scheduled'
  is_published: boolean
  noindex: boolean
  social_opt_in: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  items?: KeepsakeGiftItem[]
}

export interface KeepsakeGiftItem {
  id: string
  gift_id: string
  kind: 'letter' | 'photo' | 'coupon' | 'card' | 'track' | 'voice'
  payload: Record<string, any>
  position: number
}

export interface GiftReveal {
  id: string
  gift_id: string
  opened_at: string
  device_info: Record<string, any> | null
}

export interface GiftReply {
  id: string
  gift_id: string
  message: string
  created_at: string
}

export interface KeepsakeDrawerEntry {
  id: string
  recipient_id: string | null
  recipient_email: string | null
  gift_id: string
  saved_at: string
}

export interface CouponRedemption {
  id: string
  gift_item_id: string
  redeemed_at: string
}

export type SlugHistory = {
  id: string
  gift_id: string
  old_slug: string
  retired_at: string
}

export const KEEPSAKE_GIFT_LABELS: Record<KeepsakeGiftType, string> = {
  letter: 'Love Letter',
  memory_book: 'Memory Book',
  coupon_booklet: 'Coupon Booklet',
  reasons: 'Reasons I Love You',
  mixtape: 'Playlist Mixtape',
}

export const WRAP_PAPERS: Record<WrapPaper, { label: string; description: string }> = {
  parchment: { label: 'Parchment', description: 'Aged, warm vellum look' },
  ruled: { label: 'Ruled', description: 'Notebook-style lines' },
  vellum: { label: 'Vellum', description: 'Smooth cream writing paper' },
  graph: { label: 'Graph', description: 'Quarter-inch grid' },
  pressed_flower: { label: 'Pressed Flower', description: 'Floral inclusions' },
}

export const WRAP_RIBBONS: Record<WrapRibbon, { label: string }> = {
  satin: { label: 'Satin ribbon' },
  grosgrain: { label: 'Grosgrain ribbon' },
  lace: { label: 'Lace ribbon' },
  leather_cord: { label: 'Leather cord' },
}

export const WRAP_SEALS: Record<WrapSeal, { label: string }> = {
  wax: { label: 'Wax seal' },
  sticker: { label: 'Seal sticker' },
  string: { label: 'String tie' },
  none: { label: 'No seal' },
}

export const RESERVED_SLUGS = [
  'admin', 'api', 'login', 'logout', 'signup', 'signin', 'dashboard',
  'g', 'gift', 'gifts', 'drawer', 'reply', 'publish', 'unpublish',
  'settings', 'account', 'profile', 'about', 'contact', 'privacy',
  'terms', 'sitemap', 'robots', 'favicon', 'opengraph', 'og',
  'report', 'delete', 'auth', 'session', 'checkout', 'stripe',
  'health', 'status', 'widget', 'embed', 'assets', 'static',
  'images', 'fonts', 'api', 'graphql', 'rest', 'webhook',
]
