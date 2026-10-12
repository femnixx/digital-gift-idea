import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveConnectionString } from '../src/lib/neon/connection'

const MIGRATIONS_DIR = join(process.cwd(), 'database', 'migrations')

async function main() {
  const connectionString = resolveConnectionString()
  if (!connectionString) {
    console.error('No database connection string configured')
    process.exit(1)
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(connectionString)

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migrations to apply.')
    return
  }

  for (const file of files) {
    const contents = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`Applying ${file}...`)
    await sql.query(contents)
    console.log(`  applied ${file}`)
  }

  console.log(`Done. ${files.length} migration(s) applied.`)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
