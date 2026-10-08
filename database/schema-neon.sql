-- =============================================
-- DIGITAL LOVE LETTERS - NEON DATABASE SCHEMA
-- PostgreSQL / Neon Schema (no Supabase)
-- =============================================

-- Extensions (pgcrypto ships on Neon; gen_random_uuid() is available)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE entry_type AS ENUM ('letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note');
CREATE TYPE media_type AS ENUM ('image', 'audio', 'video');
CREATE TYPE flower_type AS ENUM ('rose', 'sunflower', 'tulip', 'lily', 'orchid', 'peony', 'daisy', 'lavender');
CREATE TYPE drink_type AS ENUM ('coffee', 'tea', 'hot_chocolate', 'latte', 'matcha', 'chai', 'cappuccino', 'espresso', 'americano', 'mocha', 'cold_brew');

-- =============================================
-- USERS TABLE (replaces Supabase auth.users + profiles)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SESSIONS TABLE (JWT session tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- =============================================
-- ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type entry_type NOT NULL DEFAULT 'letter',
    content JSONB NOT NULL DEFAULT '{}',
    publish_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unlock_at TIMESTAMPTZ,
    unlock_condition TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEDIA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    type media_type NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    filename TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOUQUET FLOWERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bouquet_flowers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    flower_type flower_type NOT NULL,
    color TEXT NOT NULL,
    note TEXT,
    position_x DECIMAL(5, 2) DEFAULT 50,
    position_y DECIMAL(5, 2) DEFAULT 50,
    rotation DECIMAL(5, 2) DEFAULT 0,
    scale DECIMAL(3, 2) DEFAULT 1.0,
    sort_order INTEGER DEFAULT 0,
    generation_seed INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POLAROID CARDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS polaroid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    date_tag TEXT,
    back_note TEXT,
    hidden_message TEXT,
    tilt_degrees DECIMAL(5, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    template TEXT DEFAULT 'classic_white',
    orientation TEXT DEFAULT 'portrait',
    font_family TEXT DEFAULT 'sans-serif',
    font_size TEXT DEFAULT '16px',
    font_color TEXT DEFAULT '#000000',
    text_alignment TEXT DEFAULT 'center',
    stickers TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SCRATCH CARDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS scratch_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    cover_color TEXT DEFAULT '#E8B4B8',
    cover_image_url TEXT,
    reveal_content JSONB NOT NULL,
    scratch_threshold DECIMAL(3, 2) DEFAULT 0.6,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- OPEN WHEN LETTERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS open_when_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    trigger_label TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_value TEXT,
    envelope_color TEXT DEFAULT '#F5E6E8',
    seal_emoji TEXT DEFAULT '💌',
    content JSONB NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COFFEE DATE ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS coffee_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    drink_types drink_type[] DEFAULT '{}',
    custom_name TEXT,
    message TEXT,
    gift_card_url TEXT,
    local_cafe_suggestion TEXT,
    animation_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VOICE NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    title TEXT,
    transcript TEXT,
    waveform_data JSONB,
    duration_seconds INTEGER,
    cassette_side TEXT DEFAULT 'A',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTNER INTERACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS partner_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RELATIONSHIP SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS relationship_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_one_id UUID REFERENCES users(id) ON DELETE CASCADE,
    partner_two_id UUID REFERENCES users(id) ON DELETE CASCADE,
    anniversary_date DATE,
    partner_one_location_name TEXT,
    partner_two_location_name TEXT,
    partner_one_timezone TEXT,
    partner_two_timezone TEXT,
    distance_km DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOVE DIARIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS love_diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    entry_ids UUID[] DEFAULT '{}',
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_entries_slug ON entries(slug);
CREATE INDEX IF NOT EXISTS idx_entries_publish_at ON entries(publish_at);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);
CREATE INDEX IF NOT EXISTS idx_media_entry_id ON media(entry_id);
CREATE INDEX IF NOT EXISTS idx_bouquet_flowers_entry_id ON bouquet_flowers(entry_id);
CREATE INDEX IF NOT EXISTS idx_polaroid_cards_entry_id ON polaroid_cards(entry_id);
CREATE INDEX IF NOT EXISTS idx_scratch_cards_entry_id ON scratch_cards(entry_id);
CREATE INDEX IF NOT EXISTS idx_open_when_letters_entry_id ON open_when_letters(entry_id);
CREATE INDEX IF NOT EXISTS idx_coffee_dates_entry_id ON coffee_dates(entry_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_entry_id ON voice_notes(entry_id);
CREATE INDEX IF NOT EXISTS idx_partner_interactions_entry_id ON partner_interactions(entry_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationship_settings_updated_at BEFORE UPDATE ON relationship_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_love_diaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_love_diaries_updated_at
    BEFORE UPDATE ON love_diaries
    FOR EACH ROW
    EXECUTE FUNCTION update_love_diaries_updated_at();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION generate_slug(base_text TEXT, entry_type entry_type)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INTEGER := 0;
BEGIN
    slug := lower(regexp_replace(base_text, '[^a-z0-9]+', '-', 'g'));
    slug := regexp_replace(slug, '^-+|-+$', '', 'g');
    WHILE EXISTS (SELECT 1 FROM entries WHERE entries.slug = slug) LOOP
        counter := counter + 1;
        slug := slug || '-' || counter;
    END LOOP;
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371;
    dLat DECIMAL := radians(lat2 - lat1);
    dLon DECIMAL := radians(lon2 - lon1);
    a DECIMAL;
    c DECIMAL;
BEGIN
    a := sin(dLat/2) * sin(dLat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), 1-a);
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;