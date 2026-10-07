function sanitizeIdentifier(value: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error('Invalid identifier')
  }
  return value
}

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

export function getNeonClient(): NeonQueryFunction<any, any> {
  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    throw new Error('Missing NEON_DATABASE_URL. Add it to your environment to use Neon table operations.')
  }

  return neon(connectionString)
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log('Usage: npm run neon:tables <command> [options]')
    console.log('')
    console.log('Commands:')
    console.log('  list                          List tables in the public schema')
    console.log('  query <table>                 Select up to 100 rows from a table')
    console.log('  insert <table> <json>         Insert a JSON object into a table')
    console.log('  create-demo                   Create demo tables and rows for testing')
    console.log('  drop-demo                     Drop demo tables')
    process.exit(1)
  }

  const client = getNeonClient()

  switch (command) {
    case 'list': {
      const rows = await (client as any).query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`)
      console.log('Tables:')
      console.table(rows)
      break
    }
    case 'query': {
      const table = sanitizeIdentifier(args[1] || '')
      if (!table) {
        console.error('Missing table name')
        process.exit(1)
      }
      const rows = await (client as any).query(`SELECT * FROM ${table} LIMIT 100`)
      console.log(`Rows in ${table}:`)
      console.table(rows)
      break
    }
    case 'insert': {
      const table = sanitizeIdentifier(args[1] || '')
      const raw = args[2]
      if (!table || !raw) {
        console.error('Usage: npm run neon:tables insert <table> <json>')
        process.exit(1)
      }
      const values = JSON.parse(raw)
      const keys = Object.keys(values)
      const vals = Object.values(values)
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ')
      const result = await (client as any).query(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        vals
      )
      console.log('Inserted:')
      console.table(result)
      break
    }
    case 'create-demo': {
      await (client as any).query(`CREATE TABLE IF NOT EXISTS neon_demo_entries (id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
      await (client as any).query(`INSERT INTO neon_demo_entries (id, title) VALUES ('demo-1', 'NeonDB demo entry') ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`)
      const rows = await (client as any).query(`SELECT * FROM neon_demo_entries`)
      console.log('Demo table created. Rows:')
      console.table(rows)
      break
    }
    case 'drop-demo': {
      await (client as any).query(`DROP TABLE IF EXISTS neon_demo_entries`)
      console.log('Dropped neon_demo_entries if it existed.')
      break
    }
    default:
      console.error(`Unknown command: ${command}`)
      console.log('Run without arguments to see usage.')
      process.exit(1)
  }
}

main().catch((error) => {
  console.error('Neon tables command failed:', error)
  process.exit(1)
})
