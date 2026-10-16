export type EntryType = 
  | 'letter' 
  | 'bucket_list'
  | 'scrapbook'
  | 'polaroid'
  | 'scratch_card'
  | 'open_when'
  | 'coffee_date'
  | 'voice_note'

export type MediaType = 'image' | 'audio' | 'video'
export type ScrapbookLayout = 'grid' | 'freeform' | 'polaroid' | 'frame'
export type DrinkType = 'coffee' | 'tea' | 'hot_chocolate' | 'latte' | 'matcha' | 'chai' | 'cappuccino' | 'espresso' | 'americano' | 'mocha' | 'cold_brew'
export type UnlockCondition = 'date' | 'manual' | 'location' | 'mood'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  timezone: string
  latitude: number | null
  longitude: number | null
  location_name: string | null
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  slug: string
  title: string
  type: EntryType
  content: Record<string, any>
  publish_at: string
  unlock_at: string | null
  unlock_condition: UnlockCondition | null
  /** When set, the gift is deleted after this time. Null means permanent. */
  expires_at?: string | null
  /** Unguessable token granting edit and delete rights. Returned once at creation. */
  edit_token?: string | null
  is_published: boolean
  is_featured: boolean
  view_count: number
  /** Null for anonymously created gifts. */
  created_by: string | null
  created_at: string
  updated_at: string
  // Relations
  media?: Media[]
  scrapbook_pages?: ScrapbookPage[]
  polaroid_cards?: PolaroidCard[]
  scratch_cards?: ScratchCard[]
  open_when_letters?: OpenWhenLetter[]
  coffee_dates?: CoffeeDate[]
  voice_notes?: VoiceNote[]
  bucket_list?: BucketListItem[]
}

export interface Media {
  id: string
  entry_id: string
  type: MediaType
  storage_path: string
  public_url: string | null | null
  filename: string | null
  mime_type: string | null
  size_bytes: number | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  sort_order: number
  created_at: string
}

export interface ScrapbookPage {
  id: string
  entry_id: string
  layout_type: ScrapbookLayout
  background_color: string
  background_image: string | null
  created_at: string
  updated_at: string
  items?: ScrapbookItem[]
}

export interface ScrapbookItem {
  id: string
  page_id: string
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
  created_at: string
  updated_at: string
}

export interface PolaroidCard {
  id: string
  entry_id: string
  image_url: string
  caption: string | null
  date_tag: string | null
  back_note: string | null
  hidden_message: string | null
  tilt_degrees: number
  sort_order: number
  template: 'classic_white' | 'vintage' | 'black_white' | 'colorful_border'
  orientation: 'portrait' | 'landscape'
  font_family: string
  font_size: string
  font_color: string
  text_alignment: 'left' | 'center' | 'right'
  stickers: string[]
  created_at: string
}

export interface ScratchCard {
  id: string
  entry_id: string
  cover_color: string
  cover_image_url: string | null
  reveal_content: {
    type: 'text' | 'image'
    content: string
  }
  scratch_threshold: number
  created_at: string
}

export interface OpenWhenLetter {
  id: string
  entry_id: string
  trigger_label: string
  trigger_type: "date" | "manual" | "location" | "mood"
  trigger_value: string | null
  envelope_color: string
  seal_emoji: string
  content: Record<string, any>
  is_unlocked: boolean
  unlocked_at: string | null
  sort_order: number
  created_at: string
}

export interface CoffeeDate {
  id: string
  entry_id: string
  drink_types: DrinkType[]
  custom_name: string | null
  message: string | null
  gift_card_url: string | null
  local_cafe_suggestion: string | null
  animation_triggered: boolean
  created_at: string
}

export interface VoiceNote {
  media?: Media
  id: string
  entry_id: string
  media_id: string | null
  title: string | null
  transcript: string | null
  waveform_data: number[] | null
  duration_seconds: number | null
  cassette_side: 'A' | 'B'
  created_at: string
}

export interface BucketListItem {
  id: string
  entry_id: string
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
  created_at: string
  updated_at: string
}

export interface PartnerInteraction {
  id: string
  entry_id: string
  interaction_type: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface LoveDiary {
  id: string
  user_id: string
  title: string
  description: string
  entry_ids: string[]
  cover_image: string | null
  created_at: string
  updated_at: string
  entry_count: number
  total_views: number
}

export interface CreateDiaryForm {
  title: string
  description: string
  entry_ids?: string[]
  cover_image?: string
}

export interface LoveDiaryWithMetrics extends LoveDiary {
  entries_detail: Array<{
    id: string
    slug: string
    title: string
    type: EntryType
    is_published: boolean
    view_count: number
    created_at: string
  }>
}

export interface RelationshipSettings {
  id: string
  partner_one_id: string
  partner_two_id: string
  anniversary_date: string | null
  partner_one_location_name: string | null
  partner_two_location_name: string | null
  partner_one_timezone: string | null
  partner_two_timezone: string | null
  distance_km: number | null
  created_at: string
  updated_at: string
}

// Form types
export interface CreateEntryForm {
  title: string
  type: EntryType
  slug: string
  content: Record<string, any>
  publish_at: string
  unlock_at?: string
  unlock_condition?: UnlockCondition
  is_published: boolean
}

export interface ScrapbookFormData {
  layout_type: ScrapbookLayout
  background_color: string
  background_image: string | null
  items: {
    media_id?: string
    image_url?: string
    caption: string
    position_x: number
    position_y: number
    width: number
    height: number
    rotation: number
    scale: number
    z_index: number
    date_tag: string
    font_family: string
    font_size: string
    font_color: string
    text_alignment: string
  }[]
}

export interface PolaroidFormData {
  cards: {
    image_url: string
    caption: string
    date_tag: string
    back_note: string
    hidden_message: string
    tilt_degrees: number
  }[]
}

export interface ScratchCardFormData {
  cover_color: string
  cover_image_url?: string
  reveal_content: {
    type: 'text' | 'image'
    content: string
  }
  scratch_threshold: number
}

export interface OpenWhenFormData {
  letters: {
    trigger_label: string
    trigger_type: "date" | "manual" | "location" | "mood"
    trigger_value: string
    envelope_color: string
    seal_emoji: string
    content: Record<string, any>
  }[]
}

export interface CoffeeDateFormData {
  drink_types: DrinkType[]
  custom_name: string
  message: string
  gift_card_url: string
  local_cafe_suggestion: string
}

export interface VoiceNoteFormData {
  title: string
  audio_file: File
  transcript?: string
}

export const SCRAPBOOK_LAYOUT_CONFIG: Record<ScrapbookLayout, { 
  name: string
  emoji: string
  description: string
  columns: number
  rows: number
}> = {
  grid: { name: 'Grid', emoji: '⬜', description: 'Perfectly aligned photos in a neat grid', columns: 3, rows: 3 },
  freeform: { name: 'Freeform', emoji: '🎨', description: 'Drag, rotate, and layer photos freely', columns: 0, rows: 0 },
  polaroid: { name: 'Polaroid Style', emoji: '📸', description: 'Photos in classic polaroid frames with captions', columns: 2, rows: 2 },
  frame: { name: 'Framed Collage', emoji: '🖼️', description: 'Photos in decorative frames on a styled background', columns: 3, rows: 2 },
}

export const DRINK_CONFIG: Record<DrinkType, { 
  name: string
  emoji: string
  color: string
  steamColor: string
  description: string
  priceSuggestion: string
}> = {
  coffee: { name: 'Coffee', emoji: '☕', color: '#4B3621', steamColor: '#E8E8E8', description: 'Classic bold coffee', priceSuggestion: '$4-6' },
  tea: { name: 'Tea', emoji: '🍵', color: '#D4A574', steamColor: '#F0F0F0', description: 'Soothing warm tea', priceSuggestion: '$3-5' },
  hot_chocolate: { name: 'Hot Chocolate', emoji: '🍫', color: '#3D2314', steamColor: '#E8E8E8', description: 'Rich creamy cocoa', priceSuggestion: '$5-7' },
  latte: { name: 'Latte', emoji: '🥛', color: '#C9B896', steamColor: '#F5F5F5', description: 'Smooth espresso with steamed milk', priceSuggestion: '$5-7' },
  matcha: { name: 'Matcha', emoji: '🍵', color: '#7CB342', steamColor: '#E8F5E9', description: 'Vibrant green tea latte', priceSuggestion: '$6-8' },
  chai: { name: 'Chai', emoji: '🫖', color: '#8D6E63', steamColor: '#F5F5F5', description: 'Spiced tea with warmth', priceSuggestion: '$5-7' },
  cappuccino: { name: 'Cappuccino', emoji: '☕', color: '#D7CCC8', steamColor: '#F5F5F5', description: 'Foamy espresso perfection', priceSuggestion: '$5-7' },
  espresso: { name: 'Espresso', emoji: '🥃', color: '#3E2723', steamColor: '#E8E8E8', description: 'Bold concentrated shot', priceSuggestion: '$3-5' },
  americano: { name: 'Americano', emoji: '☕', color: '#5D4037', steamColor: '#E8E8E8', description: 'Smooth diluted espresso', priceSuggestion: '$4-6' },
  mocha: { name: 'Mocha', emoji: '🍫', color: '#4E342E', steamColor: '#E8E8E8', description: 'Chocolate coffee bliss', priceSuggestion: '$6-8' },
  cold_brew: { name: 'Cold Brew', emoji: '🧊', color: '#3E2723', steamColor: '#E8E8E8', description: 'Slow-steeped smooth cold coffee', priceSuggestion: '$5-7' },
}

export const UNLOCK_CONDITIONS: Record<UnlockCondition, { label: string; description: string }> = {
  date: { label: 'Specific Date', description: 'Unlocks automatically on a chosen date' },
  manual: { label: 'Manual Unlock', description: 'You decide when to unlock it for them' },
  location: { label: 'Location Based', description: 'Unlocks when they visit a specific place' },
  mood: { label: 'Mood Trigger', description: 'Unlocks when they select a specific mood' },
}