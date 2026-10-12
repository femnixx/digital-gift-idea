import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveConnectionString } from '../src/lib/neon/connection'

/**
 * Applies the numbered SQL migrations in database/migrations, in order.
 *
 * Files may contain several statements, so they are split on `;` and run one at
 * a time: the Neon HTTP driver runs a single statement per query. Comment lines
 * are stripped first so a `--` example containing a semicolon cannot split a
 * statement incorrectly.
 */
function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  return withoutComments
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
}

async function main() {
  const connectionString = resolveConnectionString()
  if (!connectionString) {
    console.error('No database connection string configured')
    process.exit(1)
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(connectionString)

  const dir = join(process.cwd(), 'database', 'migrations')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migrations to apply.')
    return
  }

  let applied = 0
  for (const file of files) {
    const statements = splitStatements(readFileSync(join(dir, file), 'utf8'))
    console.log(`Applying ${file} (${statements.length} statement(s))...`)
    for (const statement of statements) {
      await sql.query(statement)
    }
    applied += 1
    console.log(`  applied ${file}`)
  }

  console.log(`Done. ${applied} migration(s) applied.`)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
