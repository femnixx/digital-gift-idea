import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const FETCH_OPTS: RequestInit = { redirect: 'manual' }

let serverAvailable = false

function log(label: string, status: number, extra = '') {
  console.log(`[bucket-list-test] ${label}: ${status} ${extra}`)
}

async function createGift(body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/entries`, {
    ...FETCH_OPTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data, token: data.entry?.edit_token as string | undefined }
}

async function withEntryToken(body: Record<string, unknown>) {
  const created = await createGift(body)
  return { slug: created.data.entry.slug, token: created.token as string }
}

describe('Bucket List feature tests', () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/me`, FETCH_OPTS)
      serverAvailable = res.status === 404 || res.status === 200 || res.status === 307 || res.status === 401
    } catch {
      serverAvailable = false
    }
  })

  it('requires a running dev or production server', () => {
    if (!serverAvailable) throw new Error(`No server at ${BASE}`)
  })

  const bucketListPayload = {
    title: 'Visit Tokyo',
    description: 'See the cherry blossoms in spring',
    dream_date: '2025-03-15',
    location: 'Tokyo, Japan',
    tags: ['travel', 'dream'],
    is_achieved: false,
  }

  it('creates a bucket list entry type and fetches the empty list', async () => {
    const { slug, token } = await withEntryToken({
      title: 'My Bucket List',
      type: 'bucket_list',
      slug: `bl-test-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const res = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`)
    const data = await res.json()
    log('get empty list', res.status, '')
    expect(res.status).toBe(200)
    expect(data.items || data.memories).toEqual([])
  }, 30000)

  it('saves a bucket list item and reads it back', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Bucket List',
      type: 'bucket_list',
      slug: `bl-save-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const post = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketListPayload),
    })
    const postData = await post.json()
    log('save item', post.status, '')
    expect(post.status).toBe(201)
    const savedItem = postData.item || postData.memory
    expect(savedItem.title).toBe('Visit Tokyo')

    const get = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`)
    const getData = await get.json()
    log('load items', get.status, '')
    expect(get.status).toBe(200)
    const items = getData.items || getData.memories || []
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Visit Tokyo')
    expect(items[0].is_achieved).toBe(false)
  }, 40000)

  it('rejects an invalid dream_date format', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Bucket List',
      type: 'bucket_list',
      slug: `bl-baddate-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const res = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bucketListPayload, dream_date: 'not-a-date' }),
    })
    log('bad date', res.status, '(expect 400)')
    expect(res.status).toBe(400)
  }, 30000)

  it('rejects read/write without the edit token', async () => {
    const { slug } = await withEntryToken({
      title: 'Bucket List',
      type: 'bucket_list',
      slug: `bl-notoken-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const read = await fetch(`${BASE}/api/entries/${slug}/bucket-list`, FETCH_OPTS)
    log('read no token', read.status, '(expect 404)')
    expect(read.status).toBe(404)

    const write = await fetch(`${BASE}/api/entries/${slug}/bucket-list`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketListPayload),
    })
    log('write no token', write.status, '(expect 404)')
    expect(write.status).toBe(404)
  }, 30000)

  it('replaces the full list via PUT', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Bucket List',
      type: 'bucket_list',
      slug: `bl-replace-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketListPayload),
    })

    const put = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ ...bucketListPayload, title: 'Changed Goal' }] }),
    })
    const putData = await put.json()
    log('replace', put.status, '')
    expect(put.status).toBe(200)
    const items = putData.items || putData.memories || []
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Changed Goal')
  }, 40000)

  it('deletes an item by id', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Bucket List',
      type: 'bucket_list',
      slug: `bl-delete-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const created = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketListPayload),
    })
    const createdData = await created.json()
    const itemId = createdData.item?.id || createdData.memory?.id

    const itemIdParam = itemId ? (createdData.item_id_param || 'item_id') : 'item_id'
    const del = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}&item_id=${itemId}`, {
      ...FETCH_OPTS, method: 'DELETE',
    })
    log('delete', del.status, '')
    expect(del.status).toBe(200)

    const get = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`)
    const data = await get.json()
    expect((data.items || data.memories || []).length).toBe(0)
  }, 40000)

  it('exposes items to the public through the public API', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Bucket List',
      type: 'bucket_list',
      slug: `bl-public-${Date.now().toString(36)}`,
      content: {},
      is_published: true,
    })

    await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bucketListPayload),
    })

    const pub = await fetch(`${BASE}/api/public/entries/${slug}`)
    const entry = (await pub.json()).entry
    log('public', pub.status, '')
    expect(pub.status).toBe(200)
    expect(entry.bucket_list || entry.memories).toHaveLength(1)
    const items = entry.bucket_list || entry.memories || []
    expect(items[0].title).toBe('Visit Tokyo')
  }, 40000)

  it('sorts items chronologically by dream_date', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Bucket List',
      type: 'bucket_list',
      slug: `bl-sort-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Later', dream_date: '2025-06-01', is_achieved: false }),
    })
    await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Earlier', dream_date: '2025-01-15', is_achieved: false }),
    })

    const get = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`)
    const data = await get.json()
    const items = data.items || data.memories || []
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('Earlier')
    expect(items[1].title).toBe('Later')
  }, 40000)
})
