import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

type Entry = {
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
}

type Media = {
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

const STORAGE_KEY = 'digital-love-letters-db'

const STORAGE_FILE = '.tmp/test-slugs-db.json'

function readDB() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
    }
  } catch {}
  return { entries: [], media: [], profiles: [] }
}

function writeDB(data: any) {
  const dir = path.dirname(STORAGE_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
}

function now() {
  return new Date().toISOString()
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-love-letter'
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
      data.entries = data.entries.map((e: Entry) => e.id === id ? { ...e, ...patch, updated_at: now() } : e)
      writeDB(data)
      return data.entries.find((e: Entry) => e.id === id)
    },
    remove: (id: string) => {
      const data = readDB()
      data.entries = data.entries.filter((e: Entry) => e.id !== id)
      writeDB(data)
    },
    seed: () => {
      const data = readDB()
      if (data.entries && data.entries.length > 0) return

      const userId = 'demo-user-1'
      const entries: Entry[] = [
        {
          id: randomUUID(),
          slug: '2026-09-15',
          title: 'Good Morning, My Love',
          type: 'letter',
          content: { message: "Waking up thinking of you..." },
          publish_at: now(),
          is_published: true,
          view_count: 3,
          created_by: userId,
          created_at: now(),
          updated_at: now()
        },
        {
          id: randomUUID(),
          slug: 'sep-14-sunflowers',
          title: 'Sep 14 Sunflowers',
          type: 'letter',
          content: { message: "Sunflowers for you..." },
          publish_at: now(),
          is_published: true,
          view_count: 1,
          created_by: userId,
          created_at: now(),
          updated_at: now()
        }
      ]

      const media: Media[] = entries.map((entry) => ({
        id: randomUUID(),
        entry_id: entry.id,
        type: 'image' as const,
        storage_path: `entries/${entry.id}/cover.jpg`,
        public_url: 'https://demo-storage.example.com/cover.jpg',
        filename: 'cover.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 1024,
        sort_order: 0,
        created_at: now()
      }))

      writeDB({ entries, media, profiles: [] })
    }
  }
}

function ensureDB() {
  const data = readDB()
  if (!data.entries || data.entries.length === 0) {
    db.entries.seed()
  }
}

function listSlugs() {
  ensureDB()
  const entries = db.entries.list()
  console.log('Current slugs:')
  console.log('--------------')
  entries.forEach((entry) => {
    console.log(`- ${entry.slug} (${entry.type}) - ${entry.title}`)
  })
  console.log(`\nTotal: ${entries.length} entries`)
}

function createEntry(title: string, slug?: string) {
  ensureDB()
  const finalSlug = slug || generateSlug(title)
  const existing = db.entries.getBySlug(finalSlug)
  if (existing) {
    console.log(`\nSlug already exists: ${finalSlug}`)
    console.log(`  Title: ${existing.title}`)
    return null
  }

  const entry: Entry = {
    id: randomUUID(),
    slug: finalSlug,
    title,
    type: 'letter',
    content: { message: `A love letter from my heart to yours - ${title}` },
    publish_at: now(),
    is_published: true,
    view_count: 0,
    created_by: 'test-user',
    created_at: now(),
    updated_at: now()
  }

  const created = db.entries.insert(entry)
  console.log(`\nCreated entry:`)
  console.log(`  Slug: ${created.slug}`)
  console.log(`  Title: ${created.title}`)
  console.log(`  Type: ${created.type}`)
  console.log(`  Published: ${created.is_published}`)
  return created
}

function getEntry(slug: string) {
  ensureDB()
  const entry = db.entries.getBySlug(slug)
  if (!entry) {
    console.log(`\nEntry not found: ${slug}`)
    return null
  }
  console.log(`\nFound entry:`)
  console.log(`  Slug: ${entry.slug}`)
  console.log(`  Title: ${entry.title}`)
  console.log(`  Type: ${entry.type}`)
  console.log(`  Published: ${entry.is_published}`)
  console.log(`  View count: ${entry.view_count}`)
  return entry
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'list':
      listSlugs()
      break
    case 'create':
      const title = args[1] || 'My New Love Letter'
      const slug = args[2]
      createEntry(title, slug)
      break
    case 'get':
      const getSlug = args[1]
      if (!getSlug) {
        console.log('Usage: npm run test:slugs get <slug>')
        process.exit(1)
      }
      getEntry(getSlug)
      break
    case 'seed':
      db.entries.seed()
      console.log('Demo data seeded')
      listSlugs()
      break
    default:
      console.log('Usage:')
      console.log('  npm run test:slugs list              - List all slugs')
      console.log('  npm run test:slugs create [title] [slug] - Create new entry')
      console.log('  npm run test:slugs get <slug>        - Get entry by slug')
      console.log('  npm run test:slugs seed              - Seed demo data')
  }
}

main()
