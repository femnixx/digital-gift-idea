const { neon } = require('@neondatabase/serverless')
require('dotenv').config({path: '.env.local'})
const { resolveConnectionString } = require('./src/lib/neon/connection')
const sql = neon(resolveConnectionString())
sql`select id, caption, template, orientation, image_url from polaroid_cards`.then(rows => console.log(JSON.stringify(rows, null, 2))).catch(e=>console.error('ERR',e.message))
 