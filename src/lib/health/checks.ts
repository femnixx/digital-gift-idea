import { sql } from '@/lib/neon/auth'
import { getMediaStore } from '@/lib/storage/objectStorage'
import type { EntryType } from '@/types'
import { GIFT_LABELS, GIFT_TABLES } from '@/lib/gifts/catalog'

export { GIFT_LABELS, GIFT_TABLES }

export type HealthState = 'healthy' | 'degraded' | 'down'

export interface HealthCheck {
  id: string
  label: string
  state: HealthState
  latencyMs: number
  detail: string
}

export interface GiftHealth extends HealthCheck {
  type: EntryType
  liveCount: number
}

/**
 * Real, dependency-driven health probes. Every check actually exercises the
 * service it names rather than reporting a constant, so a genuine outage shows
 * up as degraded or down.
 */

async function withLatency<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: string; ms: number }> {
  const started = Date.now()
  try {
    const result = await fn()
    return { result, ms: Date.now() - started }
  } catch (error: any) {
    return { error: error?.message || 'unknown error', ms: Date.now() - started }
  }
}

const STATE_BY_MS = (ms: number, degradedAt = 1500): HealthState => (ms > degradedAt ? 'degraded' : 'healthy')

export async function checkDatabase(): Promise<HealthCheck> {
  const { result, error, ms } = await withLatency(() => sql`select 1 as ok`)

  if (error || !result) {
    return { id: 'database', label: 'Database', state: 'down', latencyMs: ms, detail: error || 'no response' }
  }

  const count = await withLatency(() => sql`select count(*)::int as n from entries`)
  const rows = count.result as Array<{ n: number }> | undefined

  return {
    id: 'database',
    label: 'Database (Neon Postgres)',
    state: STATE_BY_MS(ms),
    latencyMs: ms,
    detail: rows ? `${rows[0].n} entries` : 'reachable',
  }
}

export async function checkStorage(): Promise<HealthCheck> {
  const { error, ms } = await withLatency(async () => {
    // Touching the store forces a real round-trip to the storage endpoint
    // rather than reading a cached client.
    await getMediaStore().exists('__health_probe__')
  })

  if (error) {
    return { id: 'storage', label: 'Storage (S3 media bucket)', state: 'down', latencyMs: ms, detail: error }
  }

  return {
    id: 'storage',
    label: 'Storage (S3 media bucket)',
    state: STATE_BY_MS(ms),
    latencyMs: ms,
    detail: 'reachable',
  }
}

export async function checkAuth(): Promise<HealthCheck> {
  const { result, error, ms } = await withLatency(async () => {
    // Exercises the real query path a session check performs, without needing a
    // token: the session table must be readable and the users lookup resolvable.
    const sessions = await sql`select count(*)::int as n from sessions`
    const users = await sql`select count(*)::int as n from users`
    return { sessions: sessions[0]?.n ?? 0, users: users[0]?.n ?? 0 }
  })

  if (error || !result) {
    return { id: 'auth', label: 'Auth & sessions', state: 'down', latencyMs: ms, detail: error || 'no response' }
  }

  return {
    id: 'auth',
    label: 'Auth & sessions',
    state: STATE_BY_MS(ms),
    latencyMs: ms,
    detail: `${result.sessions} sessions, ${result.users} users`,
  }
}

export async function checkGift(type: EntryType): Promise<GiftHealth> {
  const table = GIFT_TABLES[type]
  const { result, error, ms } = await withLatency(async () => {
    const rows = await sql.query(`select count(*)::int as n from ${table}`)
    return (rows as Array<{ n: number }>)[0]?.n ?? 0
  })

  if (error) {
    return {
      id: `gift-${type}`,
      type,
      label: GIFT_LABELS[type],
      state: 'down',
      latencyMs: ms,
      detail: error,
      liveCount: 0,
    }
  }

  return {
    id: `gift-${type}`,
    type,
    label: GIFT_LABELS[type],
    state: STATE_BY_MS(ms),
    latencyMs: ms,
    detail: `${result} rows in ${table}`,
    liveCount: result ?? 0,
  }
}

export async function checkAll() {
  const giftTypes = Object.keys(GIFT_TABLES) as EntryType[]

  const [database, storage, auth, gifts] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkAuth(),
    Promise.all(giftTypes.map((type) => checkGift(type))),
  ])

  const services = [database, storage, auth, ...gifts]

  const summary = services.reduce(
    (acc, service) => {
      acc[service.state] += 1
      return acc
    },
    { healthy: 0, degraded: 0, down: 0 }
  )

  return {
    overall: summary.down > 0 ? ('down' as HealthState) : summary.degraded > 0 ? ('degraded' as HealthState) : ('healthy' as HealthState),
    summary,
    services,
  }
}
