export type EntryType = 
  | 'letter' 
  | 'bouquet' 
  | 'polaroid' 
  | 'scratch_card' 
  | 'open_when' 
  | 'coffee_date' 
  | 'voice_note'

export type MediaType = 'image' | 'audio' | 'video'
export type FlowerType = 'rose' | 'sunflower' | 'tulip' | 'lily' | 'orchid' | 'peony' | 'daisy' | 'lavender'
export type ArrangementType = 'random' | 'circular' | 'vase' | 'heart'
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
  is_published: boolean
  is_featured: boolean
  view_count: number
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  media?: Media[]
  bouquet_flowers?: BouquetFlower[]
  polaroid_cards?: PolaroidCard[]
  scratch_cards?: ScratchCard[]
  open_when_letters?: OpenWhenLetter[]
  coffee_dates?: CoffeeDate[]
  voice_notes?: VoiceNote[]
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

export interface BouquetFlower {
  id: string
  entry_id: string
  flower_type: FlowerType
  color: string
  note: string | null
  position_x: number
  position_y: number
  rotation: number
  scale: number
  sort_order: number
  created_at: string
  generation_seed?: number
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

export interface PartnerInteraction {
  id: string
  entry_id: string
  interaction_type: string
  metadata: Record<string, unknown>
  created_at: string
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

export interface BouquetFormData {
  flowers: {
    flower_type: FlowerType
    color: string
    note: string
    position_x: number
    position_y: number
    rotation: number
    scale: number
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

// Flower configurations
export const FLOWER_CONFIG: Record<FlowerType, { 
  name: string
  emoji: string
  petals: number
  defaultColors: string[]
}> = {
  rose: { name: 'Rose', emoji: '🌹', petals: 32, defaultColors: ['#FF0000', '#FF69B4', '#FFFFFF', '#FFFF00', '#FFC0CB', '#8B0000'] },
  sunflower: { name: 'Sunflower', emoji: '🌻', petals: 34, defaultColors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'] },
  tulip: { name: 'Tulip', emoji: '🌷', petals: 6, defaultColors: ['#FF69B4', '#FF0000', '#FFFF00', '#FFFFFF', '#800080', '#FFA500'] },
  lily: { name: 'Lily', emoji: '🌸', petals: 6, defaultColors: ['#FFFFFF', '#FFB6C1', '#FFD700', '#FF69B4', '#E6E6FA'] },
  orchid: { name: 'Orchid', emoji: '🌺', petals: 5, defaultColors: ['#DA70D6', '#BA55D3', '#FFFFFF', '#FF69B4', '#DDA0DD'] },
  peony: { name: 'Peony', emoji: '💮', petals: 40, defaultColors: ['#FF69B4', '#FFB6C1', '#FFFFFF', '#FFC0CB', '#DB7093'] },
  daisy: { name: 'Daisy', emoji: '🌼', petals: 34, defaultColors: ['#FFFFFF', '#FFFF00', '#FFF8DC', '#F5F5DC'] },
  lavender: { name: 'Lavender', emoji: '🪻', petals: 4, defaultColors: ['#E6E6FA', '#D8BFD8', '#9370DB', '#BA55D3'] },
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