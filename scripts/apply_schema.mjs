import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const schemaText = readFileSync('/tmp/schema.sql', 'utf8');

const conn = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!conn) {
  console.error('No database connection string configured');
  process.exit(1);
}

const sql = neon(conn);

const statements = schemaText
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  await sql.query(stmt);
  console.log('Applied:', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
}

console.log('Schema applied successfully');
process.exit(0);
