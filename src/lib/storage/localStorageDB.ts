const STORAGE_KEY = 'digital-love-letters-db'

export type Entry = {
  id: string
  slug: string
  title: string
  type: string
  content: Record<string, any>
  publish_at: string
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
  media?: Media[]
  bouquet_flowers?: any[]
  polaroid_cards?: any[]
  scratch_cards?: any[]
  open_when_letters?: any[]
  coffee_dates?: any[]
  voice_notes?: any[]
}

export type Media = {
  id: string
  entry_id: string
  type: 'image' | 'audio' | 'video'
  storage_path: string
  public_url: string | null
  filename: string | null
  mime_type: string | null
  size_bytes: number | null
  sort_order: number
  created_at: string
}

function readDB() {
  if (typeof window === 'undefined') return { entries: [], media: [], profiles: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { entries: [], media: [], profiles: [] }
}

function writeDB(data: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const db = {
  entries: {
    list: () => readDB().entries as Entry[],
    get: (id: string) => readDB().entries.find((e: Entry) => e.id === id),
    getBySlug: (slug: string) => readDB().entries.find((e: Entry) => e.slug === slug),
    insert: (entry: Entry) => {
      const data = readDB()
      data.entries = [entry, ...(data.entries || [])]
      writeDB(data)
      return entry
    },
    update: (id: string, patch: Partial<Entry>) => {
      const data = readDB()
      data.entries = data.entries.map((e: Entry) => e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e)
      writeDB(data)
      return data.entries.find((e: Entry) => e.id === id)
    },
    remove: (id: string) => {
      const data = readDB()
      data.entries = data.entries.filter((e: Entry) => e.id !== id)
      writeDB(data)
    }
  },
  media: {
    list: () => readDB().media as Media[],
    getByEntry: (entryId: string) => readDB().media.filter((m: Media) => m.entry_id === entryId),
    insert: (media: Media) => {
      const data = readDB()
      data.media = [...(data.media || []), media]
      writeDB(data)
      return media
    },
    remove: (id: string) => {
      const data = readDB()
      data.media = data.media.filter((m: Media) => m.id !== id)
      writeDB(data)
    }
  },
  seed: (demo?: any) => {
    if (readDB().entries.length === 0 && demo) {
      writeDB(demo)
    }
  },
  clear: () => writeDB({ entries: [], media: [], profiles: [] })
}

export type DB = typeof db
