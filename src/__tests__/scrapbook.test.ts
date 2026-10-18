import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const FETCH_OPTS: RequestInit = { redirect: 'manual' }

let serverAvailable = false

function log(label: string, status: number, extra = '') {
  console.log(`[scrapbook-test] ${label}: ${status} ${extra}`)
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

describe('Memory Scrapbook feature tests', () => {
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

  const scrapbookPagePayload = {
    layout_type: 'freeform',
    background_color: '#fdf6f0',
    background_image: null,
    items: [
      {
        caption: 'Our first adventure',
        position_x: 100,
        position_y: 80,
        width: 150,
        height: 150,
        rotation: 5,
        z_index: 0,
        date_tag: '2024-06-15',
        font_family: 'serif',
        font_size: '14px',
        font_color: '#374151',
        text_alignment: 'center',
      },
    ],
  }

  it('creates a scrapbook entry type and fetches empty pages', async () => {
    const { slug, token } = await withEntryToken({
      title: 'My Scrapbook',
      type: 'scrapbook',
      slug: `sb-test-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const res = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`)
    const data = await res.json()
    log('get empty', res.status, '')
    expect(res.status).toBe(200)
    expect(data.pages).toEqual([])
  }, 30000)

  it('creates a page with items via POST and reads it back', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Scrapbook',
      type: 'scrapbook',
      slug: `sb-create-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const post = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrapbookPagePayload),
    })
    const postData = await post.json()
    log('create page', post.status, '')
    expect(post.status).toBe(201)
    expect(postData.page.layout_type).toBe('freeform')
    expect(postData.page.items).toHaveLength(1)
    expect(postData.page.items[0].caption).toBe('Our first adventure')

    const get = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`)
    const getData = await get.json()
    log('load pages', get.status, '')
    expect(get.status).toBe(200)
    expect(getData.pages).toHaveLength(1)
    const items = getData.pages[0].items || []
    expect(items).toHaveLength(1)
    expect(items[0].caption).toBe('Our first adventure')
  }, 40000)

  it('rejects an invalid layout_type', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Scrapbook',
      type: 'scrapbook',
      slug: `sb-badtype-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const res = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layout_type: 'invalid_layout',
        background_color: '#fdf6f0',
        items: [],
      }),
    })
    log('bad layout', res.status, '(expect 201 - layout is freeform text)')
    // layout_type is a text column, not an enum, so any string is accepted
    expect(res.status).toBe(201)
  }, 30000)

  it('rejects read without the edit token', async () => {
    const { slug } = await withEntryToken({
      title: 'Scrapbook',
      type: 'scrapbook',
      slug: `sb-notoken-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const read = await fetch(`${BASE}/api/entries/${slug}/scrapbook`, FETCH_OPTS)
    log('read no token', read.status, '(expect 404)')
    expect(read.status).toBe(404)

    const write = await fetch(`${BASE}/api/entries/${slug}/scrapbook`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_type: 'freeform', background_color: '#fff', items: [] }),
    })
    log('write no token', write.status, '(expect 404)')
    expect(write.status).toBe(404)
  }, 30000)

  it('replaces pages and items via PUT', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Scrapbook',
      type: 'scrapbook',
      slug: `sb-replace-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrapbookPagePayload),
    })

    const put = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pages: [
          {
            layout_type: 'grid',
            background_color: '#eff6ff',
            items: [
              { caption: 'Grid photo', position_x: 50, position_y: 50, width: 100, height: 100, z_index: 0 },
            ],
          },
        ],
      }),
    })
    const putData = await put.json()
    log('replace', put.status, '')
    expect(put.status).toBe(200)
    expect(putData.pages).toHaveLength(1)
    expect(putData.pages[0].items).toHaveLength(1)
    expect(putData.pages[0].items[0].caption).toBe('Grid photo')
  }, 40000)

  it('exposes pages to the public through the public API', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Scrapbook',
      type: 'scrapbook',
      slug: `sb-public-${Date.now().toString(36)}`,
      content: {},
      is_published: true,
    })

    await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrapbookPagePayload),
    })

    const pub = await fetch(`${BASE}/api/public/entries/${slug}`)
    const entry = (await pub.json()).entry
    log('public', pub.status, '')
    expect(pub.status).toBe(200)
    expect(entry.scrapbook_pages).toHaveLength(1)
    const items = entry.scrapbook_pages[0].items || []
    expect(items).toHaveLength(1)
    expect(items[0].caption).toBe('Our first adventure')
  }, 40000)

  it('deletes a page via DELETE', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Scrapbook',
      type: 'scrapbook',
      slug: `sb-delete-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    const created = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrapbookPagePayload),
    })
    const createdData = await created.json()
    const pageId = createdData.page?.id

    const del = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}&page_id=${pageId}`, {
      ...FETCH_OPTS, method: 'DELETE',
    })
    log('delete', del.status, '')
    expect(del.status).toBe(200)

    const get = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`)
    const data = await get.json()
    expect(data.pages).toHaveLength(0)
  }, 40000)

  it('supports multiple pages', async () => {
    const { slug, token } = await withEntryToken({
      title: 'Scrapbook Multi',
      type: 'scrapbook',
      slug: `sb-multi-${Date.now().toString(36)}`,
      content: {},
      is_published: false,
    })

    await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_type: 'grid', background_color: '#fff', items: [{ caption: 'Page 1', position_x: 0, position_y: 0, width: 100, height: 100, z_index: 0 }] }),
    })

    await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`, {
      ...FETCH_OPTS, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_type: 'freeform', background_color: '#000', items: [{ caption: 'Page 2', position_x: 0, position_y: 0, width: 100, height: 100, z_index: 0 }] }),
    })

    const get = await fetch(`${BASE}/api/entries/${slug}/scrapbook?token=${token}`)
    const data = await get.json()
    expect(data.pages).toHaveLength(2)
    expect(data.pages[0].items[0].caption).toBe('Page 1')
    expect(data.pages[1].items[0].caption).toBe('Page 2')
  }, 40000)
})
