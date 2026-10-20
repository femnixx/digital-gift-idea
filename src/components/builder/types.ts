export type KeepsakeBuilderType = 'letter' | 'memory_book' | 'coupon_booklet' | 'reasons' | 'mixtape'

export interface BuilderState {
  step: number
  type: KeepsakeBuilderType | null
  title: string
  recipient_name: string
  note: string
  wrap_style: {
    paper: string
    ribbon: string
    seal: string
    tagText: string
  }
  unlock_at: string | null
  pin: string
  custom_slug: string
  is_published: boolean
  letter_body: string
  letter_paper_stock: string
  photos: Array<{ url: string; caption: string }>
  coupons: Array<{ title: string; description: string }>
  reasons: Array<{ text: string }>
  tracks: Array<{ title: string; artist: string; url: string; note: string }>
  _gift?: any
}

export const INITIAL_STATE: BuilderState = {
  step: 1,
  type: null,
  title: '',
  recipient_name: '',
  note: '',
  wrap_style: { paper: 'parchment', ribbon: 'satin', seal: 'wax', tagText: 'For You' },
  unlock_at: null,
  pin: '',
  custom_slug: '',
  is_published: true,
  letter_body: '',
  letter_paper_stock: 'parchment',
  photos: [],
  coupons: [],
  reasons: [],
  tracks: [],
}
