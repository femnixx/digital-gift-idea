require('dotenv').config({path: '.env.local'});
const fs = require('fs');
const schema = require('fs').readFileSync('/tmp/schema.sql', 'utf8');

const { neon } = require('@neondatabase/serverless');
const { resolveConnectionString } = require('./src/lib/neon/connection');
const sql = require('@neondatabase/serverless').neon(resolveConnectionString);

async function main() {
  await sql.unsafe(schema);
  console.log('Schema applied successfully');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });