require('dotenv').config({path: '.env.local'})

const { neon } = require('@neondatabase/serverless')
const { resolveConnectionString } = require('./src/lib/neon/connection')

const schema = `
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    memory_date DATE NOT NULL,
    location TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[],
    tags TEXT[],
    is_milestone BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_entry_id ON memories(entry_id);
CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(memory_date);
CREATE INDEX IF NOT EXISTS idx_memories_sort ON memories(entry_id, sort_order);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view memories of their entries" ON memories;
CREATE POLICY "Users can view memories of their entries" ON memories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM entries WHERE entries.id = memories.entry_id AND entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert memories for their entries" ON memories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM entries WHERE entries.id = memories.entry_id AND entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their memories" ON memories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM entries WHERE entries.id = memories.entry_id AND entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their memories" ON memories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM entries WHERE entries.id = memories.entry_id AND entries.user_id = auth.uid()
        )
    );
`

const { neon } = require('@neondatabase/serverless')
const { resolveConnectionString } = require('./src/lib/neon/connection')
const sql = require('@neondatabase/serverless').neon(resolveConnectionString())

async function main() {
  await sql.unsafe(schema)
  console.log('Schema applied successfully')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })