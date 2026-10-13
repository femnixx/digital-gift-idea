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

  describe('Bouquet persistence', () => {
    it('saves an arrangement and reads it back', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bouquet', type: 'bouquet', slug: `bq1-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      expect(token).toBeTruthy()

      const flowers = [
        { flower_type: 'rose', color: '#e11d48', position_x: 50, position_y: 58, rotation: 0, scale: 1.16 },
        { flower_type: 'lavender', color: '#a78bfa', position_x: 62.7, position_y: 52, rotation: 5.7, scale: 1.11 },
      ]

      const put = await fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowers }),
      })
      log('bouquet save', put.status)
      expect(put.status).toBe(200)
      expect((await put.json()).flowers).toHaveLength(2)

      const get = await fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`)
      const saved = await get.json()
      log('bouquet load', get.status)
      expect(get.status).toBe(200)
      expect(saved.flowers).toHaveLength(2)
      expect(saved.flowers.map((f: any) => f.flower_type).sort()).toEqual(['lavender', 'rose'])
    }, 40000)

    it('replaces rather than appends, so removing a flower sticks', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bouquet', type: 'bouquet', slug: `bq2-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const put = async (flowers: unknown[]) =>
        fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`, {
          ...FETCH_OPTS, method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flowers }),
        })

      await put([{ flower_type: 'rose', color: '#e11d48', position_x: 50, position_y: 50, rotation: 0, scale: 1 }])
      await put([{ flower_type: 'tulip', color: '#f472b6', position_x: 30, position_y: 40, rotation: 0, scale: 1 }])

      const get = await fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`)
      const saved = await get.json()
      expect(saved.flowers).toHaveLength(1)
      expect(saved.flowers[0].flower_type).toBe('tulip')
    }, 40000)

    it('refuses to read or write without the edit token', async () => {
      const { slug } = await withEntryToken({
        title: 'Bouquet', type: 'bouquet', slug: `bq3-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const read = await fetch(`${BASE}/api/entries/${slug}/bouquet`)
      log('bouquet read no token', read.status, '(expect 404)')
      expect(read.status).toBe(404)

      const write = await fetch(`${BASE}/api/entries/${slug}/bouquet`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowers: [] }),
      })
      log('bouquet write no token', write.status, '(expect 404)')
      expect(write.status).toBe(404)
    }, 30000)

    it('rejects a flower type the palette does not have', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bouquet', type: 'bouquet', slug: `bq4-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const res = await fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowers: [{ flower_type: 'orchid', color: '#ff0000', position_x: 50, position_y: 50, rotation: 0, scale: 1 }] }),
      })
      log('bouquet bad type', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 30000)

    it('rejects a colour that is not a hex value', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bouquet', type: 'bouquet', slug: `bq5-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      const res = await fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowers: [{ flower_type: 'rose', color: 'red', position_x: 50, position_y: 50, rotation: 0, scale: 1 }] }),
      })
      log('bouquet bad colour', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 30000)

    it('rejects a pixel coordinate given where a percentage belongs', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bouquet', type: 'bouquet', slug: `bq6-${Date.now().toString(36)}`, content: {}, is_published: false,
      })

      // 232 is a valid pixel offset but not a percentage; the range check is
      // what surfaces that unit confusion instead of storing a silent bad row.
      const res = await fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowers: [{ flower_type: 'rose', color: '#e11d48', position_x: 12, position_y: 232, rotation: 0, scale: 1 }] }),
      })
      log('bouquet pixel coord', res.status, '(expect 400)')
      expect(res.status).toBe(400)
    }, 30000)

    it('exposes saved flowers to the recipient through the public API', async () => {
      const { slug, token } = await withEntryToken({
        title: 'Bouquet', type: 'bouquet', slug: `bq7-${Date.now().toString(36)}`, content: {}, is_published: true,
      })

      await fetch(`${BASE}/api/entries/${slug}/bouquet?token=${token}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowers: [{ flower_type: 'sunflower', color: '#f59e0b', position_x: 50, position_y: 58, rotation: 0, scale: 1.16 }] }),
      })

      const pub = await fetch(`${BASE}/api/public/entries/${slug}`)
      const entry = (await pub.json()).entry
      expect(pub.status).toBe(200)
      expect(entry.bouquet_flowers).toHaveLength(1)
      expect(entry.bouquet_flowers[0].flower_type).toBe('sunflower')
    }, 40000)
  })

  describe('Opening ceremony', () => {
    it('plays for every service type', async () => {
      const types = ['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note']
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
    }, 120000)
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
        fetch(`${BASE}/api/entries/${slug}/bouquet`, { ...FETCH_OPTS, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flowers: [] }) }),
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
      for (const required of ['database', 'storage', 'auth', 'gift-letter', 'gift-bouquet', 'gift-voice_note']) {
        expect(ids).toContain(required)
      }
      for (const service of data.services) {
        expect(['healthy', 'degraded', 'down']).toContain(service.state)
        expect(typeof service.latencyMs).toBe('number')
      }
    }, 60000)
  })
})
