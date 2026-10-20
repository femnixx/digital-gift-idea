// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { createGift, publishGift, getGiftBySlug } from '@/app/actions/gifts'
import { sql } from '@/lib/db'

// DATABASE_URL lives in .env.local; the db client reads it lazily on first use.
loadEnv({ path: path.resolve(process.cwd(), '.env.local') })

const HAS_DB = Boolean(process.env.DATABASE_URL)
const createdGiftIds: string[] = []

async function cleanup() {
  if (!HAS_DB || createdGiftIds.length === 0) return
  const s = sql()
  for (const id of createdGiftIds.splice(0)) {
    await s`delete from gifts where id = ${id}`
  }
}

describe.skipIf(!HAS_DB)('createGift against the live database', () => {
  beforeAll(async () => {
    // Prove the connection works before asserting on it.
    const s = sql()
    await s`select 1`
  })

  afterAll(async () => {
    await cleanup()
  })

  it('gift_items really has a `payload` column (the 500-error regression)', async () => {
    const s = sql()
    const rows = (await s`
      select column_name from information_schema.columns
      where table_name = 'gift_items' and table_schema = 'public'
      order by column_name
    `) as unknown as Array<{ column_name: string }>
    const columns = rows.map((r) => r.column_name)
    expect(columns).toContain('payload')
    expect(columns).not.toContain('payload_json')
  })

  it('inserts the gift and all of its items', async () => {
    const result = await createGift({
      type: 'letter',
      title: 'Keepsake test letter',
      recipient_name: 'Ava',
      note: 'A note for the test',
      wrap_style: 'airmail',
      items: [
        { kind: 'letter', payload: { body: 'Dear Ava,', paper_stock: 'parchment' }, position: 0 },
        { kind: 'card', payload: { text: 'Reason one' }, position: 1 },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    createdGiftIds.push(result.gift.id)

    expect(result.gift.slug).toMatch(/^[a-z0-9-]{3,60}$/)
    expect(result.gift.status).toBe('draft')

    const s = sql()
    const giftRows = (await s`
      select id, title, recipient_name, note, status, slug from gifts where id = ${result.gift.id}
    `) as unknown as Array<Record<string, any>>
    expect(giftRows).toHaveLength(1)
    expect(giftRows[0].title).toBe('Keepsake test letter')
    expect(giftRows[0].recipient_name).toBe('Ava')

    const itemRows = (await s`
      select kind, position, payload from gift_items
      where gift_id = ${result.gift.id} order by position asc
    `) as unknown as Array<Record<string, any>>

    expect(itemRows).toHaveLength(2)
    expect(itemRows[0].kind).toBe('letter')
    expect(itemRows[0].position).toBe(0)
    expect(itemRows[0].payload).toMatchObject({ body: 'Dear Ava,', paper_stock: 'parchment' })
    expect(itemRows[1].kind).toBe('card')
    expect(itemRows[1].payload).toMatchObject({ text: 'Reason one' })
  })

  it('reads the gift back through getGiftBySlug with payloads intact', async () => {
    const created = await createGift({
      type: 'letter',
      title: 'Keepsake round trip',
      items: [{ kind: 'letter', payload: { body: 'Round trip body' }, position: 0 }],
      custom_slug: `ks-test-${Date.now().toString(36)}`,
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    createdGiftIds.push(created.gift.id)

    const gift = await getGiftBySlug(created.gift.slug)
    expect(gift).not.toBeNull()
    expect(gift?.items).toHaveLength(1)
    expect((gift?.items as any)[0].payload).toMatchObject({ body: 'Round trip body' })
  })

  it('reports slug_taken instead of throwing when the slug is already used', async () => {
    const slug = `ks-dup-${Date.now().toString(36)}`
    const first = await createGift({
      type: 'letter',
      title: 'First',
      items: [],
      custom_slug: slug,
    })
    expect(first.ok).toBe(true)
    if (first.ok) createdGiftIds.push(first.gift.id)

    const second = await createGift({
      type: 'letter',
      title: 'Second',
      items: [],
      custom_slug: slug,
    })
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.error).toBe('slug_taken')
  })

  it('rejects reserved slugs before touching the database', async () => {
    const result = await createGift({
      type: 'letter',
      title: 'Reserved',
      items: [],
      custom_slug: 'admin',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('reserved_slug')
  })

  it('rolls the whole insert back when one item violates a constraint', async () => {
    const slug = `ks-rollback-${Date.now().toString(36)}`
    const result = await createGift({
      type: 'letter',
      title: 'Rollback',
      items: [
        { kind: 'letter', payload: { body: 'one' }, position: 0 },
        { kind: 'card', payload: { text: 'two' }, position: 0 },
      ],
      custom_slug: slug,
    })

    expect(result.ok).toBe(false)

    const s = sql()
    const rows = (await s`select id from gifts where slug = ${slug}`) as unknown as Array<{ id: string }>
    expect(rows).toHaveLength(0)
  })

  it('publishes a draft and keeps the slug it was created with', async () => {
    const slug = `ks-publish-${Date.now().toString(36)}`
    const created = await createGift({
      type: 'letter',
      title: 'Publishable',
      items: [{ kind: 'letter', payload: { body: 'hello' }, position: 0 }],
      custom_slug: slug,
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    createdGiftIds.push(created.gift.id)

    const published = await publishGift(created.gift.id)
    expect(published.ok).toBe(true)
    if (published.ok) expect(published.slug).toBe(slug)

    const gift = await getGiftBySlug(slug)
    expect((gift as any)?.status).toBe('published')
  })
})

if (!HAS_DB) {
  describe('createGift database test', () => {
    it('is skipped because DATABASE_URL is not set', () => {
      expect(HAS_DB).toBe(false)
    })
  })
}
