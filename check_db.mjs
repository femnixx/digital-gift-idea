import { neon } from '@neondatabase/serverless'
import { resolveConnectionString } from './src/lib/neon/connection.js'
const sql = neon(resolveConnectionString())
const rows = await sql`select id, caption, template, orientation, image_url from polaroid_cards`
console.log(JSON.stringify(rows, null, 2))
