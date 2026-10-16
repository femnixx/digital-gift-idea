import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const FETCH_OPTS: RequestInit = { redirect: 'manual' }

/**
 * Guardrails for the anonymous gift model.
 *
 * There is no public sign-up or sign-in anywhere in the product. A gift is
 * created without an account and the creator keeps an unguessable edit token.
 * These tests assert that boundary, plus the degenerate inputs that used to
 * produce 500s.
 */

let serverAvailable = false

function log(label: string, status: number, extra = '') {
  console.log(`[guardrail] ${label}: ${status} ${extra}`)
}

/** Creates a gift with no credentials and returns the edit token the API issues. */
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

async function withToken(res: Response) {
  return (res.headers.get('set-cookie') || '').split(';')[0] || ''
}

function entryApi(slug: string, token?: string) {
  return `${BASE}/api/entries/${encodeURIComponent(slug)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
}

async function withEntryToken(body: Record<string, unknown>) {
  const created = await createGift(body)
  return { slug: created.data.entry.slug, token: created.token as string }
}

describe('Anonymous gift flow guardrails', () => {
  beforeAll(async () => {
    try {
      // A removed route and an existing one both prove the server is up.
      const res = await fetch(`${BASE}/api/auth/me`, FETCH_OPTS)
      serverAvailable = res.status === 404 || res.status === 200 || res.status === 307
    } catch {
      serverAvailable = false
    }
  })

  it('requires a running dev or production server', () => {
    if (!serverAvailable) throw new Error(`No server at ${BASE}`)
  })

  describe('No public accounts exist', () => {
    it('the signup route is gone', async () => {
      const res = await fetch(`${BASE}/api/auth/signup`, { ...FETCH_OPTS, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      log('signup route', res.status, '(expect 404)')
      expect(res.status).toBe(404)
    }, 20000)

    it('the login route is gone', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, { ...FETCH_OPTS, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      log('login route', res.status, '(expect 404)')
      expect(res.status).toBe(404)
    }, 20000)

    it('the sign-up page is gone', async () => {
      const res = await fetch(`${BASE}/signup`, FETCH_OPTS)
      log('/signup page', res.status, '(expect 404)')
      expect(res.status).toBe(404)
    }, 20000)

    it('the standalone sign-in page is gone', async () => {
      const res = await fetch(`${BASE}/login`, FETCH_OPTS)
      log('/login page', res.status, '(expect 404)')
      expect(res.status).toBe(404)
    }, 20000)

    it('the only login that remains is the admin endpoint', async () => {
      const res = await fetch(`${BASE}/admin/login`, FETCH_OPTS)
      log('/admin/login', res.status, '(expect 200, reachable without a session)')
      expect(res.status).toBe(200)

      const api = await fetch(`${BASE}/api/admin/login`, FETCH_OPTS)
      log('/api/admin/login', api.status, '(expect 405 for GET, route exists)')
      expect(api.status).toBe(405)
    }, 30000)
  })

  describe('Anonymous creation', () => {
    it('creates a gift with no credentials and issues an edit token', async () => {
      const res = await createGift({
        title: 'For You', type: 'letter', slug: `anon-${Date.now().toString(36)}`, content: { message: 'hi' }, is_published: true,
      })
      log('anonymous create', res.status)

      expect(res.status).toBe(201)
      expect(res.token).toBeTruthy()
      expect(res.token).toMatch(/^[0-9a-f-]{36}$/)
      expect(res.data.entry?.created_by).toBeNull()
    }, 20000)

    it('rejects an invalid slug with 400', async () => {
      const res = await createGift({ title: 'x', type: 'letter', slug: 'Not A Valid Slug!', content: {}, is_published: false })
      log('invalid slug', res.status)
      expect(res.status).toBe(400)
    })

    it('rejects an unknown gift type with 400', async () => {
      const res = await createGift({ title: 'x', type: 'nope', slug: `bad-${Date.now().toString(36)}`, content: {}, is_published: false })
      log('unknown type', res.status)
      expect(res.status).toBe(400)
    })

    it('rejects a nil or malformed body rather than throwing', async () => {
      const res = await fetch(`${BASE}/api/entries`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'this is not json',
      })
      log('malformed json', res.status, '(expect 400 or 500, not a hang)')
      expect([200, 400, 500]).toContain(res.status)
    }, 20000)

    it('rejects a duplicate slug with 409', async () => {
      const slug = `dupe-${Date.now().toString(36)}`
      const first = await createGift({ title: 'a', type: 'letter', slug, content: {}, is_published: false })
      expect(first.status).toBe(201)
      const second = await createGift({ title: 'b', type: 'letter', slug, content: {}, is_published: false })
      log('duplicate slug', second.status)
      expect(second.status).toBe(409)
    }, 20000)
  })

  describe('Edit token is the only ownership proof', () => {
    it('denies a read without a token', async () => {
      const created = await createGift({ title: 'priv', type: 'letter', slug: `t1-${Date.now().toString(36)}`, content: {}, is_published: false })
      expect(created.status).toBe(201)

      const read = await fetch(entryApi(created.data.entry.slug), FETCH_OPTS)
      log('read without token', read.status, '(expect 404)')
      expect(read.status).toBe(404)
    }, 20000)

    it('denies a read with a wrong token', async () => {
      const created = await createGift({ title: 'priv', type: 'letter', slug: `t2-${Date.now().toString(36)}`, content: {}, is_published: false })
      const wrong = '00000000-0000-0000-0000-000000000000'

      const read = await fetch(entryApi(created.data.entry.slug, wrong), FETCH_OPTS)
      log('read wrong token', read.status, '(expect 404)')
      expect(read.status).toBe(404)
    }, 20000)

    it('denies an update without a token', async () => {
      const created = await createGift({ title: 'priv', type: 'letter', slug: `t3-${Date.now().toString(36)}`, content: {}, is_published: false })

      const put = await fetch(entryApi(created.data.entry.slug), {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'hijacked' }),
      })
      log('update without token', put.status, '(expect 404)')
      expect(put.status).toBe(404)
    }, 20000)

    it('allows the holder of the token to read, update and delete', async () => {
      const created = await createGift({ title: 'mine', type: 'letter', slug: `t4-${Date.now().toString(36)}`, content: {}, is_published: false })
      expect(created.token).toBeTruthy()

      const read = await fetch(entryApi(created.data.entry.slug, created.token), FETCH_OPTS)
      log('token read', read.status, '(expect 200)')
      expect(read.status).toBe(200)

      const put = await fetch(entryApi(created.data.entry.slug, created.token), {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Renamed' }),
      })
      log('token update', put.status, '(expect 200)')
      expect(put.status).toBe(200)

      const del = await fetch(entryApi(created.data.entry.slug, created.token), { ...FETCH_OPTS, method: 'DELETE' })
      log('token delete', del.status, '(expect 200)')
      expect(del.status).toBe(200)

      const gone = await fetch(`${BASE}/api/public/entries/${created.data.entry.slug}`, FETCH_OPTS)
      log('public after delete', gone.status, '(expect 404)')
      expect(gone.status).toBe(404)
    }, 40000)

    it('refuses to collide a rename with an existing slug', async () => {
      const first = await createGift({ title: 'a', type: 'letter', slug: `r1-${Date.now().toString(36)}`, content: {}, is_published: false })
      const second = await createGift({ title: 'b', type: 'letter', slug: `r2-${Date.now().toString(36)}`, content: {}, is_published: false })

      const put = await fetch(entryApi(second.data.entry.slug, second.token), {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: first.data.entry.slug }),
      })
      log('rename collision', put.status, '(expect 409)')
      expect(put.status).toBe(409)
    }, 30000)
  })

  describe('Global components never hijack the public flow', () => {
    it('loading.tsx contains no navigation at all', () => {
      const src = readFileSync('src/app/loading.tsx', 'utf8')
      // It used to router.replace('/admin') after a timeout, which dragged any
      // slow public route into the admin login screen.
      expect(src).not.toMatch(/router\.(push|replace)/)
      expect(src).not.toContain('/admin')
    })

    it('error.tsx never sends a visitor to the admin login', () => {
      const src = readFileSync('src/app/error.tsx', 'utf8')
      expect(src).not.toMatch(/router\.(push|replace)\(\s*['"`]\/admin/)
      expect(src).not.toContain('/api/admin/logout')
    })

    it('not-found.tsx never sends a visitor to the admin login', () => {
      const src = readFileSync('src/app/not-found.tsx', 'utf8')
      expect(src).not.toContain('/admin')
    })
  })

  describe('Recipient view is read-only', () => {
    it('exposes no edit affordance for any service type', async () => {
      const markers = [
        'Edit Letter', 'Edit Polaroids', 'Edit Scratch Cards',
        'Edit Open When Letters', 'Edit Coffee Date',
        'Add Scratch Card', 'Add Your First Scratch Card', 'Auto-arrange', 'Regenerate',
        'Add Bucket List Item', 'Add Your First Goal',
        'Edit Goal',
      ]

      // Every service the public view can render.
      for (const type of ['letter', 'bucket_list', 'scrapbook', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note']) {
        const slug = `ro3-${type.replace('_', '-')}-${Date.now().toString(36)}`
        const created = await createGift({
          title: 'Read only', type, slug, content: { message: 'hi' }, is_published: true,
        })
        expect(created.status).toBe(201)

        const page = await fetch(`${BASE}/daily/${slug}`)
        const html = await page.text()
        expect(page.status).toBe(200)

        for (const marker of markers) {
          expect(html, `${type} recipient view must not offer "${marker}"`).not.toContain(marker)
        }
      }
    }, 180000)
  })

  describe('Opening ceremony', () => {
    it('plays for every service type', async () => {
      const types = ['letter', 'bucket_list', 'scrapbook', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note']
      for (const t of types) {
        const slug = `cov-${t.replace('_', '-')}-${Date.now().toString(36)}`
        const created = await createGift({ title: `${t}`, type: t, slug, content: {}, is_published: true })
        expect(created.status).toBe(201)

        // The recipient must be offered the ceremony before any contents appear.
        const page = await fetch(`${BASE}/daily/${slug}`, FETCH_OPTS)
        const html = await page.text()
        expect(page.status).toBe(200)
        expect(html).toContain('Open it')
      }
    }, 180000)
  })

  describe('Public visibility', () => {
    it('a draft is not publicly visible', async () => {
      const created = await createGift({ title: 'd', type: 'letter', slug: `d-${Date.now().toString(36)}`, content: {}, is_published: false })
      const pub = await fetch(`${BASE}/api/public/entries/${created.data.entry.slug}`, FETCH_OPTS)
      log('draft public', pub.status, '(expect 404)')
      expect(pub.status).toBe(404)
    }, 20000)

    it('a published gift is visible and stays visible on revisit', async () => {
      const created = await createGift({ title: 'p', type: 'letter', slug: `p-${Date.now().toString(36)}`, content: { message: 'I love you' }, is_published: true })

      const first = await fetch(`${BASE}/api/public/entries/${created.data.entry.slug}`, FETCH_OPTS)
      const second = await fetch(`${BASE}/api/public/entries/${created.data.entry.slug}`, FETCH_OPTS)
      log('published revisit', 200, `first=${first.status} second=${second.status}`)

      expect(first.status).toBe(200)
      expect(second.status).toBe(200)

      const body = await first.json()
      expect(body.entry.content.message).toBe('I love you')
    }, 30000)
  })

  describe('QR codes are permanent and real', () => {
    it('serves a genuine PNG for a published gift', async () => {
      const created = await createGift({ title: 'q', type: 'letter', slug: `q1-${Date.now().toString(36)}`, content: {}, is_published: true })

      const qr = await fetch(`${BASE}/api/public/entries/${created.data.entry.slug}/qr?size=256`)
      const bytes = new Uint8Array(await qr.arrayBuffer())
      log('qr', qr.status, `${qr.headers.get('content-type')} ${bytes.byteLength}b`)

      expect(qr.status).toBe(200)
      expect(qr.headers.get('content-type')).toBe('image/png')
      // PNG magic number proves this is an image, not an error body.
      expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
    }, 30000)

    it('refuses a QR code for a draft', async () => {
      const created = await createGift({ title: 'q', type: 'letter', slug: `q2-${Date.now().toString(36)}`, content: {}, is_published: false })
      const qr = await fetch(`${BASE}/api/public/entries/${created.data.entry.slug}/qr`)
      log('qr for draft', qr.status, '(expect 404)')
      expect(qr.status).toBe(404)
    }, 20000)

    it('clamps an absurd size instead of rendering it', async () => {
      const created = await createGift({ title: 'q', type: 'letter', slug: `q3-${Date.now().toString(36)}`, content: {}, is_published: true })
      const qr = await fetch(`${BASE}/api/public/entries/${created.data.entry.slug}/qr?size=999999`)
      const bytes = new Uint8Array(await qr.arrayBuffer())
      log('qr huge size', qr.status, `${bytes.byteLength}b (expect bounded)`)
      expect(qr.status).toBe(200)
      expect(bytes.byteLength).toBeLessThan(1024 * 1024)
    }, 30000)
  })

  describe('Polaroid persistence', () => {
    const card = (over: Record<string, unknown> = {}) => ({
      image_url: 'gifts/placeholder/a.jpg',
      caption: 'Us',
      tilt_degrees: -6,
      template: 'classic_white',
      orientation: 'portrait',
      font_family: 'serif',
      font_size: '18px',
      font_color: '#000000',
      text_alignment: 'center',
      stickers: ['heart', 'star'],
      ...over,
    })

    it('saves a deck and returns the stored cards, not an empty list', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Polaroids', type: 'polaroid', slug: `po1-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const put = await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card(), card({ caption: 'Again', tilt_degrees: 8, template: 'vintage_sepia', orientation: 'landscape', stickers: [] })] }),
      })
      log('polaroid save', put.status)
      expect(put.status).toBe(200)

      const saved = await put.json()
      // The response must list what was written. Returning an empty array while
      // the rows landed is exactly the bug this guards against.
      expect(saved.cards).toHaveLength(2)
      expect(saved.cards.map((c: any) => c.caption).sort()).toEqual(['Again', 'Us'])
      expect(saved.cards[0].stickers.length).toBeGreaterThan(0)

      const get = await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`)
      expect(get.status).toBe(200)
      expect((await get.json()).cards).toHaveLength(2)
    }, 40000)

    it('persists the styling columns and the sticker array', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Polaroids', type: 'polaroid', slug: `po2-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card()] }),
      })

      const get = await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`)
      const saved = (await get.json()).cards[0]
      expect(saved.tilt_degrees).toBe(-6)
      expect(saved.template).toBe('classic_white')
      expect(saved.orientation).toBe('portrait')
      expect(saved.font_family).toBe('serif')
      expect(saved.font_size).toBe('18px')
      expect(saved.text_alignment).toBe('center')
      expect(saved.stickers).toEqual(['heart', 'star'])
    }, 40000)

    it('replaces rather than appends', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Polaroids', type: 'polaroid', slug: `po3-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const put = async (n: number) =>
        fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`, {
          ...FETCH_OPTS, method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: Array.from({ length: n }, () => card()) }),
        })

      await put(3)
      const after = await put(1)
      expect((await after.json()).cards).toHaveLength(1)
    }, 40000)

    it('refuses to read or write without the edit token', async () => {
      const { slug } = await withEntryToken({
        title: 'Polaroids', type: 'polaroid', slug: `po4-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      expect((await fetch(`${BASE}/api/entries/${slug}/polaroid-cards`)).status).toBe(404)
      const write = await fetch(`${BASE}/api/entries/${slug}/polaroid-cards`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card()] }),
      })
      log('polaroid write no token', write.status, '(expect 404)')
      expect(write.status).toBe(404)
    }, 30000)

    it('rejects an out-of-range font size', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Polaroids', type: 'polaroid', slug: `po5-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const res = await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card({ font_size: 'huge' })] }),
      })
      log('polaroid bad font size', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 30000)

    it('rejects an unknown template and a non-hex colour', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Polaroids', type: 'polaroid', slug: `po6-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const badTemplate = await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card({ template: 'nope' })] }),
      })
      expect(badTemplate.status).toBe(400)

      const badColor = await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card({ font_color: 'red' })] }),
      })
      expect(badColor.status).toBe(400)
    }, 30000)

    it('exposes the deck to the recipient through the public API', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Polaroids', type: 'polaroid', slug: `po7-${Date.now().toString(36)}`, content: {}, is_published: true,
      })
      await fetch(`${BASE}/api/entries/${slug}/polaroid-cards?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card()] }),
      })

      const pub = await fetch(`${BASE}/api/public/entries/${slug}`)
      const entry = (await pub.json()).entry
      expect(entry.polaroid_cards).toHaveLength(1)
      expect(entry.polaroid_cards[0].caption).toBe('Us')
    }, 40000)
  })

  describe('Voice note persistence', () => {
    it('accepts the exact payload the recorder sends', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vn1-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      // This is what VoiceNoteRecorder posts, waveform_data null included. The
      // schema used to allow undefined but not null, so every real save failed
      // with a 400 while the tests, which omitted the field, passed. media_id is
      // omitted here because it must reference a row the upload endpoint made.
      const res = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Voice Note',
          duration_seconds: 12,
          waveform_data: null,
          cassette_side: 'A',
        }),
      })
      log('voice note save', res.status)
      expect(res.status).toBe(201)
      expect((await res.json()).voice_note?.title).toBe('Voice Note')
    }, 30000)

    it('rounds a float duration, which is what a browser sends', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vnfloat-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      // audio.duration returns a float. duration_seconds is an INTEGER column, so
      // the driver passed 12.345678 straight to an int4 and Postgres rejected it
      // with 22P02, surfacing as a 500. The column cannot hold a fraction, so the
      // value is rounded at the boundary instead.
      const res = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Float', duration_seconds: 12.345678, waveform_data: null }),
      })
      log('voice note float duration', res.status)
      expect(res.status).toBe(201)
      expect((await res.json()).voice_note?.duration_seconds).toBe(12)
    }, 30000)

    it('still rejects a duration outside the range', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vnrange-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const tooLong = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x', duration_seconds: 601, waveform_data: null }),
      })
      log('voice note 601s', tooLong.status, '(expect 400)')
      expect(tooLong.status).toBe(400)

      const negative = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x', duration_seconds: -5, waveform_data: null }),
      })
      expect(negative.status).toBe(400)
    }, 30000)

    it('accepts a real waveform array when the recorder has one', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vn2-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const res = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'With bars', duration_seconds: 4, waveform_data: [0.1, 0.9, 0.4], cassette_side: 'A' }),
      })
      log('voice note with waveform', res.status)
      expect(res.status).toBe(201)
      expect((await res.json()).voice_note?.waveform_data).toEqual([0.1, 0.9, 0.4])
    }, 30000)

    it('refuses to save without the edit token', async () => {
      const { slug } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vn3-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const res = await fetch(`${BASE}/api/entries/${slug}/voice-notes`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x', waveform_data: null }),
      })
      log('voice note no token', res.status, '(expect 404)')
      expect(res.status).toBe(404)
    }, 30000)

    it('returns a playable url for the audio, not an empty string', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vnplay-${Date.now().toString(36)}`, content: {}, is_published: true,
      })

      // Upload a real file so the note references an actual media row, which is
      // what the player needs. The note carnes media_id only, so the public
      // payload used to leave media undefined and hand the player an empty url.
      const form = new FormData()
      form.append('file', new File([new Uint8Array(1024)], 'a.webm', { type: 'audio/webm' }))
      form.append('entry_id', slug)
      form.append('type', 'audio')
      form.append('token', token)
      const upload = await fetch(`${BASE}/api/media`, { method: 'POST', body: form })
      expect(upload.status).toBe(201)
      const mediaId = (await upload.json()).media.id

      const saved = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Playable', media_id: mediaId, duration_seconds: 6, waveform_data: null }),
      })
      log('voice note save for playback', saved.status)
      expect(saved.status).toBe(201)

      const pub = await fetch(`${BASE}/api/public/entries/${slug}`)
      const note = (await pub.json()).entry.voice_notes[0]
      expect(note.media).toBeTruthy()
      expect(note.media.public_url).toMatch(/^\/api\/public\/entries\/.*\/media\//)

      // And the url it hands back actually serves the file.
      const audio = await fetch(`${BASE}${note.media.public_url}`)
      log('voice note audio fetch', audio.status)
      expect(audio.status).toBe(200)
    }, 40000)

    it('stores and returns a frequency waveform', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vnwave-${Date.now().toString(36)}`, content: {}, is_published: true,
      })

      // A realistic capture: 48 bands normalised to 0..1, the shape the meter
      // produces. Verifies the array survives the JSONB round-trip rather than
      // arriving back as a string or truncated.
      const levels = Array.from({ length: 48 }, (_, i) => Number((Math.abs(Math.sin(i / 3)) * 0.9 + 0.1).toFixed(3)))

      const res = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'With bars', duration_seconds: 9, waveform_data: levels, cassette_side: 'A' }),
      })
      log('voice note waveform save', res.status)
      expect(res.status).toBe(201)
      expect((await res.json()).voice_note?.waveform_data).toEqual(levels)

      const pub = await fetch(`${BASE}/api/public/entries/${slug}`)
      const note = (await pub.json()).entry.voice_notes[0]
      expect(note.waveform_data).toEqual(levels)
      expect(note.waveform_data).toHaveLength(48)
    }, 40000)

    it('deletes a note by id, and refuses without a token', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Voice', type: 'voice_note', slug: `vn4-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const created = await fetch(`${BASE}/api/entries/${slug}/voice-notes?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Doomed', waveform_data: null }),
      })
      expect(created.status).toBe(201)
      const noteId = (await created.json()).voice_note.id

      const del = await fetch(`${BASE}/api/entries/${slug}/voice-notes?id=${noteId}&token=${token}`, {
        ...FETCH_OPTS, method: 'DELETE',
      })
      log('voice note delete', del.status)
      expect(del.status).toBe(200)

      const again = await fetch(`${BASE}/api/entries/${slug}/voice-notes?id=${noteId}&token=${token}`, {
        ...FETCH_OPTS, method: 'DELETE',
      })
      log('voice note delete again', again.status, '(expect 200, delete is idempotent)')
      expect(again.status).toBe(200)
    }, 30000)
  })

  describe('Scratch card persistence', () => {
    const payload = {
      cover_color: '#0284c7',
      reveal_content: { type: 'text', content: 'Scratch to reveal: I love you' },
      scratch_threshold: 0.6,
    }

    it('saves a card and reads it back', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Scratch', type: 'scratch_card', slug: `sc1-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const put = await fetch(`${BASE}/api/entries/${slug}/scratch-card?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: payload }),
      })
      log('scratch save', put.status)
      expect(put.status).toBe(200)

      const saved = await put.json()
      // The card must be an object, not an empty array: reading the delete's
      // result instead of the insert's returned nothing at all.
      expect(saved.card).toBeTruthy()
      expect(saved.card.reveal_content.content).toBe(payload.reveal_content.content)
      expect(saved.card.cover_color).toBe(payload.cover_color)

      const get = await fetch(`${BASE}/api/entries/${slug}/scratch-card?token=${token}`)
      expect(get.status).toBe(200)
      expect((await get.json()).card.reveal_content.content).toBe(payload.reveal_content.content)
    }, 40000)

    it('replaces rather than appends', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Scratch', type: 'scratch_card', slug: `sc2-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const put = async (content: string) =>
        fetch(`${BASE}/api/entries/${slug}/scratch-card?token=${token}`, {
          ...FETCH_OPTS, method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card: { ...payload, reveal_content: { type: 'text', content } } }),
        })

      await put('first')
      await put('second')

      const get = await fetch(`${BASE}/api/entries/${slug}/scratch-card?token=${token}`)
      expect((await get.json()).card.reveal_content.content).toBe('second')
    }, 40000)

    it('refuses to read or write without the edit token', async () => {
      const { slug } = await withEntryToken({
        title: 'Scratch', type: 'scratch_card', slug: `sc3-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      expect((await fetch(`${BASE}/api/entries/${slug}/scratch-card`)).status).toBe(404)
      const write = await fetch(`${BASE}/api/entries/${slug}/scratch-card`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: payload }),
      })
      log('scratch write no token', write.status, '(expect 404)')
      expect(write.status).toBe(404)
    }, 30000)

    it('rejects a cover colour that is not hex', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Scratch', type: 'scratch_card', slug: `sc4-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const res = await fetch(`${BASE}/api/entries/${slug}/scratch-card?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: { ...payload, cover_color: 'red' } }),
      })
      log('scratch bad colour', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 30000)

    it('rejects an unknown reveal type', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Scratch', type: 'scratch_card', slug: `sc5-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      const res = await fetch(`${BASE}/api/entries/${slug}/scratch-card?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: { ...payload, reveal_content: { type: 'telepathy', content: 'x' } } }),
      })
      log('scratch bad reveal type', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 30000)
  })

  describe('Gift lifetime', () => {
    it('defaults to permanent when no expiry is given', async () => {
      const res = await createGift({ title: 't', type: 'letter', slug: `ttl1-${Date.now().toString(36)}`, content: {}, is_published: false })
      expect(res.status).toBe(201)
      expect(res.data.entry.expires_at).toBeNull()
    })

    it('accepts an expiry inside the 30-day cap', async () => {
      const slug = `ttl2-${Date.now().toString(36)}`
      const res = await createGift({
        title: 't', type: 'letter', slug, content: {}, is_published: true,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      expect(res.status).toBe(201)
      expect(res.data.entry.expires_at).toBeTruthy()
    }, 20000)

    it('rejects an expiry beyond the 30-day cap', async () => {
      const slug = `ttl3-${Date.now().toString(36)}`
      const res = await createGift({
        title: 't', type: 'letter', slug, content: {}, is_published: false,
        expires_at: new Date(Date.now() + 31 * 86400000).toISOString(),
      })
      log('create 31-day ttl', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 20000)

    it('rejects an expiry in the past', async () => {
      const slug = `ttl4-${Date.now().toString(36)}`
      const res = await createGift({
        title: 't', type: 'letter', slug, content: {}, is_published: false,
        expires_at: new Date(Date.now() - 86400000).toISOString(),
      })
      log('create past ttl', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 20000)

    it('rejects a malformed expiry', async () => {
      const slug = `ttl5-${Date.now().toString(36)}`
      const res = await createGift({
        title: 't', type: 'letter', slug, content: {}, is_published: false,
        expires_at: 'someday',
      })
      log('create garbage ttl', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 20000)

    it('lets the owner set and then clear a lifetime', async () => {
      const slug = `ttl6-${Date.now().toString(36)}`
      const created = await createGift({ title: 't', type: 'letter', slug, content: {}, is_published: false })
      expect(created.token).toBeTruthy()

      const set = await fetch(`${BASE}/api/entries/${slug}?token=${created.token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: new Date(Date.now() + 3 * 86400000).toISOString() }),
      })
      log('set ttl', set.status)
      expect(set.status).toBe(200)

      const clear = await fetch(`${BASE}/api/entries/${slug}?token=${created.token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: null }),
      })
      log('clear ttl', clear.status)
      expect(clear.status).toBe(200)
      expect((await clear.json()).entry?.expires_at ?? null).toBeNull()

      await fetch(`${BASE}/api/entries/${slug}?token=${created.token}`, { ...FETCH_OPTS, method: 'DELETE' })
    }, 40000)

    it('still refuses an out-of-range lifetime when set later', async () => {
      const slug = `ttl7-${Date.now().toString(36)}`
      const created = await createGift({ title: 't', type: 'letter', slug, content: {}, is_published: false })
      const res = await fetch(`${BASE}/api/entries/${slug}?token=${created.token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: new Date(Date.now() + 90 * 86400000).toISOString() }),
      })
      log('set 90-day ttl', res.status, '(expect 400)')
      expect(res.status).toBe(400)
      await fetch(`${BASE}/api/entries/${slug}?token=${created.token}`, { ...FETCH_OPTS, method: 'DELETE' })
    }, 30000)
  })

  describe('Share link stays read-only', () => {
    it('the public page exposes no edit affordance', async () => {
      const created = await createGift({
        title: 'Read only', type: 'letter', slug: `ro1-${Date.now().toString(36)}`, content: {}, is_published: true,
      })
      const page = await fetch(`${BASE}/daily/${created.data.entry.slug}`, FETCH_OPTS)
      const html = await page.text()
      // The opening ceremony is expected; an edit control is not.
      expect(page.status).toBe(200)
      expect(html).not.toContain('Start Editing')
      expect(html).not.toContain('Auto-arrange')
    }, 30000)

    it('no write endpoint is reachable without the edit token', async () => {
      const created = await createGift({
        title: 'Read only', type: 'letter', slug: `ro2-${Date.now().toString(36)}`, content: {}, is_published: true,
      })
      const slug = created.data.entry.slug

      // A recipient knows the slug from the shared link, and that must not be
      // enough to change anything.
      const attempts = [
        fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Hijacked' }) }),
        fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE' }),
        fetch(`${BASE}/api/entries/${slug}/scrapbook`, { ...FETCH_OPTS, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pages: [] }) }),
      ]
      for (const attempt of attempts) {
        const res = await attempt
        expect(res.status).toBe(404)
      }

      // And the creator, holding the token, still can.
      const owner = await fetch(`${BASE}/api/entries/${slug}?token=${created.token}`, { ...FETCH_OPTS, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Renamed' }) })
      expect(owner.status).toBe(200)

      await fetch(`${BASE}/api/entries/${slug}?token=${created.token}`, { ...FETCH_OPTS, method: 'DELETE' })
    }, 40000)
  })

  describe('Bucket List persistence', () => {
    const bucketListPayload = {
      title: 'Visit Tokyo',
      description: 'See the cherry blossoms in spring',
      dream_date: '2024-03-15',
      location: 'Tokyo, Japan',
      tags: ['travel', 'dream'],
      is_achieved: false,
    }

    it('saves items and reads them back', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bucket List', type: 'bucket_list', slug: `bl1-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const post = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bucketListPayload),
      })
      log('item save', post.status)
      expect(post.status).toBe(201)
      expect((await post.json()).item?.title).toBe('Visit Tokyo')

      const get = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`)
      const saved = await get.json()
      log('item load', get.status)
      expect(get.status).toBe(200)
      expect(saved.items).toHaveLength(1)
      expect(saved.items[0].title).toBe('Visit Tokyo')
      expect(saved.items[0].is_achieved).toBe(false)
    }, 40000)

    it('replaces rather than appends via PUT', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bucket List', type: 'bucket_list', slug: `bl2-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bucketListPayload),
      })

      const put = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ ...bucketListPayload, title: 'Changed' }] }),
      })
      log('item replace', put.status)
      expect(put.status).toBe(200)
      const putData = await put.json()
      expect(putData.items).toHaveLength(1)
      expect(putData.items[0].title).toBe('Changed')
    }, 40000)

    it('refuses to read or write without the edit token', async () => {
      const { slug } = await withEntryToken({
        title: 'Bucket List', type: 'bucket_list', slug: `bl3-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const read = await fetch(`${BASE}/api/entries/${slug}/bucket-list`, FETCH_OPTS)
      log('item read no token', read.status, '(expect 404)')
      expect(read.status).toBe(404)

      const write = await fetch(`${BASE}/api/entries/${slug}/bucket-list`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bucketListPayload),
      })
      log('item write no token', write.status, '(expect 404)')
      expect(write.status).toBe(404)
    }, 30000)

    it('rejects an invalid date', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bucket List', type: 'bucket_list', slug: `bl4-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const res = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bucketListPayload, dream_date: 'not-a-date' }),
      })
      log('item bad date', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 30000)

    it('deletes an item by id', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bucket List', type: 'bucket_list', slug: `bl5-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const created = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bucketListPayload),
      })
      const itemId = (await created.json()).item.id

      const del = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}&item_id=${itemId}`, {
        ...FETCH_OPTS, method: 'DELETE',
      })
      log('item delete', del.status)
      expect(del.status).toBe(200)

      const get = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`)
      expect((await get.json()).items).toHaveLength(0)
    }, 40000)

    it('exposes items to the recipient through the public API', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bucket List', type: 'bucket_list', slug: `bl6-${Date.now().toString(36)}`, content: {}, is_published: true,
      })

      await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bucketListPayload),
      })

      const pub = await fetch(`${BASE}/api/public/entries/${slug}`)
      const entry = (await pub.json()).entry
      expect(pub.status).toBe(200)
      expect(entry.bucket_list).toHaveLength(1)
      expect(entry.bucket_list[0].title).toBe('Visit Tokyo')
    }, 40000)

    it('sorts items chronologically on load', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bucket List', type: 'bucket_list', slug: `bl7-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Later', dream_date: '2024-06-01', is_achieved: false }),
      })
      await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Earlier', dream_date: '2024-01-15', is_achieved: false }),
      })

      const get = await fetch(`${BASE}/api/entries/${slug}/bucket-list?token=${token}`)
      const saved = await get.json()
      expect(saved.items).toHaveLength(2)
      expect(saved.items[0].title).toBe('Earlier')
      expect(saved.items[1].title).toBe('Later')
    }, 40000)
  })

  describe('Admin isolation', () => {
    it('an anonymous visitor cannot reach admin metrics, health or entry listing', async () => {
      for (const path of ['/api/admin/stats', '/api/admin/health', '/api/entries']) {
        const probe = await fetch(`${BASE}${path}`, FETCH_OPTS)
        log(`anon -> ${path}`, probe.status, '(expect 307 or 403)')
        expect([307, 403]).toContain(probe.status)
      }
    }, 30000)

    it('the unauthenticated database dump endpoint is gone', async () => {
      const probe = await fetch(`${BASE}/api/neon/tables?table=users`, FETCH_OPTS)
      log('/api/neon/tables', probe.status, '(expect 404)')
      expect(probe.status).toBe(404)
    }, 20000)
  })

  describe('Service health reports real results', () => {
    it('covers database, storage, auth and every gift option', async () => {
      const loginRes = await fetch(`${BASE}/api/admin/login`, {
        ...FETCH_OPTS, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin', password: process.env.ADMIN_PASSWORD || 'admin' }),
      })
      const cookie = await withToken(loginRes)

      // Assert the sign-in first. Without this the failure surfaces as an opaque
      // JSON parse error on the health response, because an empty cookie makes
      // the middleware answer with a redirect page instead.
      expect(loginRes.status, 'admin login must succeed before health can be probed').toBe(200)
      expect(cookie, 'admin login must set a session cookie').toContain('session=')

      const res = await fetch(`${BASE}/api/admin/health`, { ...FETCH_OPTS, headers: { Cookie: cookie } })
      if (res.status === 307) {
        throw new Error('health endpoint redirected, so the admin session was not accepted')
      }
      const data = await res.json()
      log('health', res.status, `overall=${data.overall} services=${(data.services || []).length}`)

      expect(res.status).toBe(200)
      const ids = (data.services || []).map((s: any) => s.id)
      for (const required of ['database', 'storage', 'auth', 'gift-letter', 'gift-bucket_list', 'gift-scrapbook', 'gift-voice_note']) {
        expect(ids).toContain(required)
      }
      for (const service of data.services) {
        expect(['healthy', 'degraded', 'down']).toContain(service.state)
        expect(typeof service.latencyMs).toBe('number')
      }
    }, 60000)
  })
})
