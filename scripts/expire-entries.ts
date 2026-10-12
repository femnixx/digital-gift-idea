import { readFileSync } from 'node:fs'
import { resolveConnectionString } from '../src/lib/neon/connection'

/**
 * Deletes gifts whose TTL has passed.
 *
 * Run on a schedule (cron, or `npm run db:expire`). Rows are removed outright,
 * along with their child rows via ON DELETE CASCADE, so an expired gift leaves
 * no residue. A null expires_at means permanent and is never touched.
 *
 * Storage objects are left in place deliberately: the media route 404s once the
 * entry row is gone, so the bytes are unreachable, and deleting them here would
 * make a restore from backup impossible.
 */
async function main() {
  const connectionString = resolveConnectionString()
  if (!connectionString) {
    console.error('No database connection string configured')
    process.exit(1)
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(connectionString)

  const nowIso = new Date().toISOString()

  const due = await sql`
    select id, slug, title, expires_at from entries
    where expires_at is not null and expires_at <= ${nowIso}
    order by expires_at asc
    limit 500
  `

  if (due.length === 0) {
    console.log('No expired gifts.')
    return
  }

  console.log(`Deleting ${due.length} expired gift(s)...`)

  let deleted = 0
  for (const row of due) {
    // RETURNING gives a truthful count. Without it the HTTP driver returns an
    // empty array for a successful DELETE, which made this script report
    // "deleted 0" while rows were actually removed.
    const removed = await sql`delete from entries where id = ${row.id} returning id`
    if (Array.isArray(removed) && removed.length > 0) {
      deleted += 1
      console.log(`  deleted ${row.slug} (expired ${row.expires_at})`)
    }
  }

  console.log(`Done. ${deleted} gift(s) deleted.`)

  if (due.length === 500) {
    console.log('Batch limit reached; run again to continue.')
  }
}

main().catch((error) => {
  console.error('Expiry failed:', error)
  process.exit(1)
})
