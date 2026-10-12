#!/usr/bin/env node
/**
 * Warms every route before the test suite runs.
 *
 * `next dev` compiles routes on demand. The first request to each route can
 * take seconds, and the smoke tests use short per-test timeouts, so a cold
 * server makes them flaky: the same suite passes on one run and times out on
 * the next depending on what got compiled. Hitting every route once up front
 * makes the run deterministic without needing a production build.
 */
const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

const ROUTES = [
  '/',
  '/create',
  '/admin/login',
  '/admin',
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/admin/login',
  '/api/admin/me',
  '/api/admin/logout',
  '/api/admin/stats',
  '/api/admin/health',
  '/api/entries',
  '/api/entries/warm-path',
  '/api/entries/warm-path/voice-notes',
  '/api/diaries',
  '/api/media',
  '/api/media?entry_id=warm',
  '/api/neon/tables',
  '/api/public/entries/warm',
  '/api/public/entries/warm/media/00000000-0000-0000-0000-000000000000',
  '/api/public/entries/warm/qr',
  '/api/public/entries/warm/interactions',
]

async function withTimeout(url, ms = 120000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    await fetch(url, { signal: controller.signal, redirect: 'manual' })
  } catch {
    // A 4xx/5xx or a reset still means the route compiled, which is the goal.
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  process.stdout.write('[warm] checking server... ')
  try {
    await fetch(BASE, { redirect: 'manual' })
  } catch {
    console.error(`\n[warm] no server at ${BASE}. Start it with \`npm run dev\` first.`)
    process.exit(1)
  }
  console.log('up')

  for (const route of ROUTES) {
    await withTimeout(`${BASE}${route}`)
    process.stdout.write('.')
  }
  console.log(`\n[warm] ${ROUTES.length} routes warmed`)
}

main()
