import type { EntryType } from '@/types'

/**
 * Gift catalog: display labels and the child table backing each option.
 *
 * Kept free of server-only imports so both the client create flow and the
 * server health checks can share one source of truth.
 */
export const GIFT_LABELS: Record<EntryType, string> = {
  letter: 'Love Letter',
  memory: 'Memory Lane',
  bouquet: 'Digital Bouquet',
  polaroid: 'Polaroid Deck',
  scratch_card: 'Scratch Card',
  open_when: 'Open When',
  coffee_date: 'Coffee Date',
  voice_note: 'Voice Note',
}

export const GIFT_TABLES: Record<EntryType, string> = {
  letter: 'entries',
  memory: 'memories',
  bouquet: 'bouquet_flowers',
  polaroid: 'polaroid_cards',
  scratch_card: 'scratch_cards',
  open_when: 'open_when_letters',
  coffee_date: 'coffee_dates',
  voice_note: 'voice_notes',
}

/** Public path a gift is viewed at. */
export const GIFT_PUBLIC_PATH = '/daily'
