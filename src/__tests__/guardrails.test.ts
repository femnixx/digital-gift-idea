import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const FETCH_OPTS: RequestInit = { redirect: 'manual' }

/**
 * Guardrails and edge cases for the public gift flow.
 *
 * These assert the security and data-integrity boundaries a visitor must never
 * be able to cross, plus the degenerate inputs that used to produce 500s.
 */

let serverAvailable = false

function log(label: string, status: number, extra = '') {
  console.log(`[guardrail] ${label}: ${status} ${extra}`)
}

async function signup(email: string, password = 'password123') {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    ...FETCH_OPTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0] || ''
  return { status: res.status, data, cookie }
}

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    ...FETCH_OPTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0] || ''
  return { status: res.status, data, cookie }
}

async function createEntry(cookie: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/entries`, {
    ...FETCH_OPTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
}

describe('Public gift flow guardrails', () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/me`, FETCH_OPTS)
      serverAvailable = res.status === 401 || res.status === 200
    } catch {
      serverAvailable = false
    }
  })

  it('requires a running dev or production server', () => {
    if (!serverAvailable) throw new Error(`No server at ${BASE}`)
  })

  describe('Account creation', () => {
    it('rejects a short password with 400', async () => {
      const res = await signup(uniqueEmail('weak'), 'short')
      log('signup short password', res.status)
      expect(res.status).toBe(400)
    })

    it('rejects a malformed email with 400', async () => {
      const res = await fetch(`${BASE}/api/auth/signup`, {
        ...FETCH_OPTS,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'password123' }),
      })
      log('signup bad email', res.status)
      expect(res.status).toBe(400)
    })

    it('refuses a duplicate email with 409', async () => {
      const email = uniqueEmail('dupe')
      const first = await signup(email)
      expect(first.status).toBe(201)
      const second = await signup(email)
      log('signup duplicate', second.status)
      expect(second.status).toBe(409)
    })

    it('issues a session cookie on signup', async () => {
      const res = await signup(uniqueEmail('cookie'))
      expect(res.status).toBe(201)
      expect(res.cookie).toContain('session=')
    }, 20000)
  })

  describe('Login', () => {
    it('rejects a wrong password with 401', async () => {
      const email = uniqueEmail('wrongpw')
      await signup(email)
      const res = await login(email, 'definitely-not-it')
      log('login wrong password', res.status)
      expect(res.status).toBe(401)
    })

    it('rejects an unknown email with 401 and does not reveal which field failed', async () => {
      const res = await login(uniqueEmail('nobody'), 'password123')
      log('login unknown user', res.status)
      expect(res.status).toBe(401)
      expect(res.data.error).toBe('Invalid credentials')
    }, 20000)

    it('does not leak the stored password hash anywhere in the response', async () => {
      const email = uniqueEmail('leak')
      const signupRes = await signup(email)
      expect(signupRes.status).toBe(201)
      const serialized = JSON.stringify(signupRes.data)
      expect(serialized).not.toContain('password_hash')
      expect(serialized).not.toMatch(/\$2[aby]\$/)
    }, 20000)
  })

  describe('Ownership boundaries', () => {
    it('a visitor cannot read another visitor\'s gift by slug', async () => {
      const owner = await signup(uniqueEmail('owner'))
      const other = await signup(uniqueEmail('other'))
      const slug = `private-${Date.now().toString(36)}`

      const created = await createEntry(owner.cookie, {
        title: 'Private', type: 'letter', slug, content: {}, is_published: false,
      })
      expect([200, 201]).toContain(created.status)

      const read = await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, headers: { Cookie: other.cookie } })
      log('cross-user read', read.status, '(expect 404, not 403 which would confirm existence)')
      expect(read.status).toBe(404)

      const updated = await fetch(`${BASE}/api/entries/${slug}`, {
        ...FETCH_OPTS, method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: other.cookie },
        body: JSON.stringify({ title: 'Hijacked' }),
      })
      log('cross-user write', updated.status)
      expect(updated.status).toBe(404)

      const deleted = await fetch(`${BASE}/api/entries/${slug}`, {
        ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: other.cookie },
      })
      log('cross-user delete', deleted.status)
      expect(deleted.status).toBe(404)

      // The real owner can still reach it, proving nothing was destroyed.
      const ownerRead = await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, headers: { Cookie: owner.cookie } })
      log('owner read after attack', ownerRead.status)
      expect(ownerRead.status).toBe(200)

      await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: owner.cookie } })
    }, 30000)
  })

  describe('Slug guardrails', () => {
    it('rejects an invalid slug with 400', async () => {
      const res = await signup(uniqueEmail('slug1'))
      const created = await createEntry(res.cookie, {
        title: 'x', type: 'letter', slug: 'Not A Valid Slug!', content: {}, is_published: false,
      })
      log('create invalid slug', created.status)
      expect(created.status).toBe(400)
    })

    it('rejects a duplicate slug with 409', async () => {
      const res = await signup(uniqueEmail('slug2'))
      const slug = `dupeslug-${Date.now().toString(36)}`
      const first = await createEntry(res.cookie, { title: 'a', type: 'letter', slug, content: {}, is_published: false })
      expect([200, 201]).toContain(first.status)
      const second = await createEntry(res.cookie, { title: 'b', type: 'letter', slug, content: {}, is_published: false })
      log('create duplicate slug', second.status)
      expect(second.status).toBe(409)
      await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: res.cookie } })
    }, 20000)

    it('rejects an unknown gift type with 400', async () => {
      const res = await signup(uniqueEmail('slug3'))
      const created = await createEntry(res.cookie, {
        title: 'x', type: 'not_a_real_type', slug: `bad-${Date.now().toString(36)}`, content: {}, is_published: false,
      })
      log('create bad type', created.status)
      expect(created.status).toBe(400)
    })
  })

  describe('Public visibility', () => {
    it('a draft is not publicly visible', async () => {
      const res = await signup(uniqueEmail('draft'))
      const slug = `draft-${Date.now().toString(36)}`
      await createEntry(res.cookie, { title: 'd', type: 'letter', slug, content: {}, is_published: false })

      const pub = await fetch(`${BASE}/api/public/entries/${slug}`, FETCH_OPTS)
      log('draft public read', pub.status, '(expect 404)')
      expect(pub.status).toBe(404)

      await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: res.cookie } })
    }, 20000)

    it('a published gift is publicly visible and stays visible on revisit', async () => {
      const res = await signup(uniqueEmail('pub'))
      const slug = `pub-${Date.now().toString(36)}`
      await createEntry(res.cookie, { title: 'p', type: 'letter', slug, content: { message: 'hi' }, is_published: true })

      const first = await fetch(`${BASE}/api/public/entries/${slug}`, FETCH_OPTS)
      const second = await fetch(`${BASE}/api/public/entries/${slug}`, FETCH_OPTS)
      log('published revisit', 200, `first=${first.status} second=${second.status}`)
      expect(first.status).toBe(200)
      expect(second.status).toBe(200)

      await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: res.cookie } })
    }, 20000)
  })

  describe('Permanent links and QR', () => {
    it('serves a real PNG QR code for a published gift', async () => {
      const res = await signup(uniqueEmail('qr'))
      const slug = `qr-${Date.now().toString(36)}`
      await createEntry(res.cookie, { title: 'q', type: 'letter', slug, content: {}, is_published: true })

      const qr = await fetch(`${BASE}/api/public/entries/${slug}/qr?size=256`)
      const type = qr.headers.get('content-type')
      const bytes = new Uint8Array(await qr.arrayBuffer())
      log('qr', qr.status, `${type} ${bytes.byteLength}b`)

      expect(qr.status).toBe(200)
      expect(type).toBe('image/png')
      // PNG magic number, so this is a real image rather than an error body.
      expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])

      await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: res.cookie } })
    }, 30000)

    it('does not serve a QR code for a draft', async () => {
      const res = await signup(uniqueEmail('qrdraft'))
      const slug = `qrdraft-${Date.now().toString(36)}`
      await createEntry(res.cookie, { title: 'q', type: 'letter', slug, content: {}, is_published: false })

      const qr = await fetch(`${BASE}/api/public/entries/${slug}/qr`)
      log('qr for draft', qr.status, '(expect 404)')
      expect(qr.status).toBe(404)

      await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: res.cookie } })
    }, 20000)

    it('clamps an absurd QR size instead of rendering it', async () => {
      const res = await signup(uniqueEmail('qrsize'))
      const slug = `qrsize-${Date.now().toString(36)}`
      await createEntry(res.cookie, { title: 'q', type: 'letter', slug, content: {}, is_published: true })

      const qr = await fetch(`${BASE}/api/public/entries/${slug}/qr?size=999999`)
      const bytes = new Uint8Array(await qr.arrayBuffer())
      log('qr huge size', qr.status, `${bytes.byteLength}b (expect bounded)`)
      expect(qr.status).toBe(200)
      // 1024 is the server-side cap, so the payload must stay well under a megabyte.
      expect(bytes.byteLength).toBeLessThan(1024 * 1024)

      await fetch(`${BASE}/api/entries/${slug}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: res.cookie } })
    }, 30000)
  })

  describe('Admin isolation', () => {
    it('a public visitor cannot reach admin metrics or health', async () => {
      const res = await signup(uniqueEmail('adminiso'))
      for (const path of ['/api/admin/stats', '/api/admin/health', '/api/admin/me']) {
        const probe = await fetch(`${BASE}${path}`, { ...FETCH_OPTS, headers: { Cookie: res.cookie } })
        log(`public -> ${path}`, probe.status, '(expect 307/403)')
        expect([307, 403]).toContain(probe.status)
      }
    }, 30000)

    it('an anonymous visitor cannot reach admin metrics or health', async () => {
      for (const path of ['/api/admin/stats', '/api/admin/health']) {
        const probe = await fetch(`${BASE}${path}`, FETCH_OPTS)
        log(`anon -> ${path}`, probe.status, '(expect 307/403)')
        expect([307, 403]).toContain(probe.status)
      }
    }, 20000)

    it('the unauthenticated database dump endpoint is gone', async () => {
      const probe = await fetch(`${BASE}/api/neon/tables?table=users`, FETCH_OPTS)
      log('/api/neon/tables', probe.status, '(expect 404)')
      expect(probe.status).toBe(404)
    }, 20000)
  })

  describe('Health checks report real, bounded results', () => {
    it('admin health covers database, storage, auth and every gift option', async () => {
      const loginRes = await fetch(`${BASE}/api/admin/login`, {
        ...FETCH_OPTS, method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin', password: process.env.ADMIN_PASSWORD || 'admin' }),
      })
      const cookie = (loginRes.headers.get('set-cookie') || '').split(';')[0] || ''

      const res = await fetch(`${BASE}/api/admin/health`, { ...FETCH_OPTS, headers: { Cookie: cookie } })
      const data = await res.json()
      log('health', res.status, `overall=${data.overall} services=${(data.services || []).length}`)

      expect(res.status).toBe(200)
      const ids = (data.services || []).map((s: any) => s.id)
      for (const required of ['database', 'storage', 'auth']) {
        expect(ids).toContain(required)
      }
      // Every gift option must be probed, not just the ones with rows.
      expect(ids).toContain('gift-letter')
      expect(ids).toContain('gift-voice_note')
      for (const service of data.services) {
        expect(['healthy', 'degraded', 'down']).toContain(service.state)
        expect(typeof service.latencyMs).toBe('number')
      }
    }, 40000)
  })
})
