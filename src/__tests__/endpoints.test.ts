import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const FETCH_OPTS: RequestInit = { redirect: 'manual' }

function logRequest(label: string, status: number, body: unknown) {
  console.log(`[smoke] ${label}: status=${status} body=${JSON.stringify(body)}`)
}

async function expectStatus(label: string, resOrWrapper: { status: number; data: unknown }, expected: number | number[]) {
  const status = resOrWrapper.status
  const data = resOrWrapper.data
  logRequest(label, status, data)
  const statuses = Array.isArray(expected) ? expected : [expected]
  expect(statuses).toContain(status)
  return data
}

let serverAvailable = false

/**
 * Sign in with the admin account. Auth is admin-only, so this is the single
 * authentication helper for the smoke suite.
 */
async function adminLogin(password = 'admin') {
  const res = await fetch(`${BASE}/api/admin/login`, {
    ...FETCH_OPTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin', password }),
  })
  const setCookie = res.headers.get('set-cookie') || ''
  const cookie = setCookie.split(';')[0] || ''
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data, cookie }
}

async function adminLogout(cookie?: string) {
  const headers: Record<string, string> = { ...FETCH_OPTS.headers as Record<string, string> }
  if (cookie) headers['Cookie'] = cookie
  const res = await fetch(`${BASE}/api/admin/logout`, { ...FETCH_OPTS, method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function createDiary(cookie: string, title = 'Smoke Diary') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Cookie: cookie }
  const res = await fetch(`${BASE}/api/diaries`, { ...FETCH_OPTS, method: 'POST', headers, body: JSON.stringify({ title }) })
  const data = await res.json().catch(() => ({}))
  logRequest('createDiary', res.status, data)
  return { status: res.status, data }
}

async function getDiaries(cookie: string, id?: string) {
  const url = new URL(`${BASE}/api/diaries`)
  if (id) url.searchParams.set('id', id)
  const res = await fetch(url.toString(), { ...FETCH_OPTS, headers: { Cookie: cookie } })
  const data = await res.json().catch(() => ({}))
  logRequest('getDiaries', res.status, data)
  return { status: res.status, data }
}

async function deleteDiary(cookie: string, id: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Cookie: cookie }
  const res = await fetch(`${BASE}/api/diaries`, { ...FETCH_OPTS, method: 'DELETE', headers, body: JSON.stringify({ id }) })
  const data = await res.json().catch(() => ({}))
  logRequest('deleteDiary', res.status, data)
  return { status: res.status, data }
}

async function createEntry(cookie: string, slug = `smoke-${Date.now().toString(36)}`, title = 'Smoke Entry', isPublished = false) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Cookie: cookie }
  const res = await fetch(`${BASE}/api/entries`, { ...FETCH_OPTS, method: 'POST', headers, body: JSON.stringify({ title, type: 'letter', slug, content: {}, is_published: isPublished }) })
  const data = await res.json().catch(() => ({}))
  logRequest('createEntry', res.status, data)
  return { status: res.status, data }
}

async function getEntry(cookie: string, slug: string) {
  const res = await fetch(`${BASE}/api/entries/${encodeURIComponent(slug)}`, { ...FETCH_OPTS, headers: { Cookie: cookie } })
  const data = await res.json().catch(() => ({}))
  logRequest('getEntry', res.status, data)
  return { status: res.status, data }
}

async function updateEntry(cookie: string, slug: string, title = 'Updated Smoke Entry') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Cookie: cookie }
  const res = await fetch(`${BASE}/api/entries/${encodeURIComponent(slug)}`, { ...FETCH_OPTS, method: 'PUT', headers, body: JSON.stringify({ title }) })
  const data = await res.json().catch(() => ({}))
  logRequest('updateEntry', res.status, data)
  return { status: res.status, data }
}

async function deleteEntry(cookie: string, slug: string) {
  const res = await fetch(`${BASE}/api/entries/${encodeURIComponent(slug)}`, { ...FETCH_OPTS, method: 'DELETE', headers: { Cookie: cookie } })
  const data = await res.json().catch(() => ({}))
  logRequest('deleteEntry', res.status, data)
  return { status: res.status, data }
}

async function getPublicEntry(slug: string) {
  const res = await fetch(`${BASE}/api/public/entries/${encodeURIComponent(slug)}`, FETCH_OPTS)
  const data = await res.json().catch(() => ({}))
  logRequest('getPublicEntry', res.status, data)
  return { status: res.status, data }
}

describe('Endpoint smoke tests', () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/me`, { ...FETCH_OPTS, method: 'GET' })
      serverAvailable = res.ok || res.status === 401 || res.status === 404 || res.status === 200
    } catch {
      serverAvailable = false
    }
  })

  it('requires a running Next.js server at NEXT_PUBLIC_APP_URL', () => {
    if (!serverAvailable) {
      throw new Error(`No server available at ${BASE}. Start the dev server to run endpoint smoke tests.`)
    }
  })

  describe('Admin auth endpoints', () => {
    it('GET /api/admin/me without session returns 401', async () => {
      const res = await fetch(`${BASE}/api/admin/me`, FETCH_OPTS)
      logRequest('me(anon)', res.status, null)
      expect(res.status).toBe(401)
    })

    it('POST /api/admin/login with bad credentials returns 401', async () => {
      const res = await adminLogin('definitely-not-the-password')
      await expectStatus('adminLogin(bad)', res, 401)
    }, 15000)

    it('POST /api/admin/login with non-string payload returns 400', async () => {
      const res = await fetch(`${BASE}/api/admin/login`, {
        ...FETCH_OPTS,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 123, password: 456 }),
      })
      logRequest('adminLogin(bad-types)', res.status, null)
      expect(res.status).toBe(400)
    }, 15000)

    it('POST /api/admin/login with correct credentials succeeds and sets session cookie', async () => {
      const res = await adminLogin()
      await expectStatus('adminLogin(ok)', res, 200)
      expect(res.data.user).toBeTruthy()
      expect(res.cookie).toContain('session=')
    }, 15000)

    it('POST /api/admin/logout succeeds with valid session', async () => {
      const login = await adminLogin()
      expect([200, 201]).toContain(login.status)
      const res = await adminLogout(login.cookie)
      await expectStatus('adminLogout(ok)', res, 200)
      expect(res.data.success).toBe(true)
    }, 15000)

    it('GET /admin/login is publicly reachable (no redirect loop)', async () => {
      const res = await fetch(`${BASE}/admin/login`, FETCH_OPTS)
      logRequest('adminLoginPage', res.status, null)
      expect(res.status).toBe(200)
    })
  })

  describe('Diary endpoints', () => {
    it('GET /api/diaries without session returns 401', async () => {
      const res = await fetch(`${BASE}/api/diaries`, FETCH_OPTS)
      const data = await res.json()
      logRequest('diaries(anon-get)', res.status, data)
      expect(res.status).toBe(401)
    })

    it('POST /api/diaries without session returns 401', async () => {
      const res = await fetch(`${BASE}/api/diaries`, {
        ...FETCH_OPTS,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'X' }),
      })
      const data = await res.json()
      logRequest('createDiary(anon)', res.status, data)
      expect(res.status).toBe(401)
    })

    it('POST /api/diaries with bad payload returns 400 when authenticated', async () => {
      const login = await adminLogin()
      const res = await fetch(`${BASE}/api/diaries`, {
        ...FETCH_OPTS,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: login.cookie },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      logRequest('createDiary(bad)', res.status, data)
      expect(res.status).toBe(400)
    }, 15000)

    it('GET/POST/DELETE /api/diaries with session succeeds', async () => {
      const login = await adminLogin()
      expect(login.status).toBe(200)

      const created = await createDiary(login.cookie, 'Smoke Diary')
      expect([200, 201]).toContain(created.status)
      const diaryId = created.data?.data?.id
      expect(diaryId).toBeTruthy()

      const got = await getDiaries(login.cookie, diaryId as string)
      expect(got.status).toBe(200)

      const deleted = await deleteDiary(login.cookie, diaryId as string)
      expect(deleted.status).toBe(200)
    }, 30000)
  })

  describe('Entry endpoints', () => {
    it('GET/POST /api/entries without session returns 401', async () => {
      const get = await fetch(`${BASE}/api/entries`, FETCH_OPTS)
      const getData = await get.json()
      logRequest('entries(anon-get)', get.status, getData)
      expect(get.status).toBe(401)

      const post = await fetch(`${BASE}/api/entries`, {
        ...FETCH_OPTS,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'X', type: 'letter', slug: 'x' }),
      })
      const postData = await post.json()
      logRequest('entries(anon-post)', post.status, postData)
      expect(post.status).toBe(401)
    })

    it('GET/PUT/DELETE /api/entries/:slug with session succeeds', async () => {
      const login = await adminLogin()
      expect(login.status).toBe(200)
      const slug = `smoke-${Date.now().toString(36)}`

      const created = await createEntry(login.cookie, slug, 'Smoke Entry')
      expect([200, 201]).toContain(created.status)

      const got = await getEntry(login.cookie, slug)
      expect(got.status).toBe(200)

      const updated = await updateEntry(login.cookie, slug, 'Updated Smoke Entry')
      expect(updated.status).toBe(200)

      const deleted = await deleteEntry(login.cookie, slug)
      expect(deleted.status).toBe(200)
    }, 30000)

    it('GET /api/entries rejects invalid pagination without a 500', async () => {
      const login = await adminLogin()
      expect(login.status).toBe(200)
      const res = await fetch(`${BASE}/api/entries?page=abc&limit=abc`, { ...FETCH_OPTS, headers: { Cookie: login.cookie } })
      const data = await res.json()
      logRequest('entries(bad-pagination)', res.status, data)
      expect(res.status).toBe(200)
    }, 15000)
  })

  describe('Public entry endpoint', () => {
    it('GET /api/public/entries/:slug returns 404 for missing published entry', async () => {
      const res = await getPublicEntry('missing-entry-xyz')
      expect(res.status).toBe(404)
    })

    it('a deleted entry stops being visible immediately', async () => {
      const login = await adminLogin()
      expect(login.status).toBe(200)
      const slug = `stale-${Date.now().toString(36)}`

      // Must be published, otherwise the public route 404s it before we ever delete.
      const created = await createEntry(login.cookie, slug, 'Stale Read Check', true)
      expect([200, 201]).toContain(created.status)
      expect(created.data.entry?.is_published).toBe(true)

      // Read once before deleting. This preconditioned the Next.js route cache
      // and used to keep answering 200 for a row that no longer existed.
      const beforeDelete = await getPublicEntry(slug)
      expect(beforeDelete.status).toBe(200)

      await deleteEntry(login.cookie, slug)

      const afterDelete = await getPublicEntry(slug)
      expect(afterDelete.status).toBe(404)
    }, 30000)

    it('an unpublished entry is not publicly visible', async () => {
      const login = await adminLogin()
      expect(login.status).toBe(200)
      const slug = `draft-${Date.now().toString(36)}`

      const created = await createEntry(login.cookie, slug, 'Unpublished Check')
      expect([200, 201]).toContain(created.status)

      // createEntry posts is_published: false in this suite, so it must stay hidden.
      const res = await getPublicEntry(slug)
      expect(res.status).toBe(404)

      await deleteEntry(login.cookie, slug)
    }, 30000)
  })

  describe('Media endpoints', () => {
    it('GET/DELETE /api/media without session returns 401', async () => {
      const get = await fetch(`${BASE}/api/media?entry_id=abc`, FETCH_OPTS)
      const getData = await get.json()
      logRequest('media(anon-get)', get.status, getData)
      expect(get.status).toBe(401)

      const del = await fetch(`${BASE}/api/media?id=abc`, { ...FETCH_OPTS, method: 'DELETE' })
      const delData = await del.json()
      logRequest('media(anon-delete)', del.status, delData)
      expect(del.status).toBe(401)
    })
  })

  describe('Removed endpoints', () => {
    it('GET /api/neon/tables is gone (used to expose the whole database unauthenticated)', async () => {
      const res = await fetch(`${BASE}/api/neon/tables?table=users`, FETCH_OPTS)
      logRequest('neonTables(removed)', res.status, null)
      // Next.js returns 404 for a route that no longer exists. Anything else is a
      // regression back to unauthenticated database access.
      expect(res.status).toBe(404)
    })
  })
})
