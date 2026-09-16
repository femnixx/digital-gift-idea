-- =============================================
-- DIGITAL LOVE LETTERS - DATABASE SCHEMA
-- PostgreSQL / Supabase Schema
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE entry_type AS ENUM ('letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note');
CREATE TYPE media_type AS ENUM ('image', 'audio', 'video');
CREATE TYPE flower_type AS ENUM ('rose', 'sunflower', 'tulip', 'lily', 'orchid', 'peony', 'daisy', 'lavender');
CREATE TYPE drink_type AS ENUM ('coffee', 'tea', 'hot_chocolate', 'latte', 'matcha', 'chai', 'cappuccino', 'espresso', 'americano', 'mocha', 'cold_brew');

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENTRIES TABLE (Main content table)
-- =============================================
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEDIA TABLE (Supabase Storage references)
-- =============================================
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE bouquet_flowers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE polaroid_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE scratch_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE open_when_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE coffee_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE voice_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE partner_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RELATIONSHIP SETTINGS TABLE
-- =============================================
CREATE TABLE relationship_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_one_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    partner_two_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
-- INDEXES
-- =============================================
CREATE INDEX idx_entries_slug ON entries(slug);
CREATE INDEX idx_entries_publish_at ON entries(publish_at);
CREATE INDEX idx_entries_type ON entries(type);
CREATE INDEX idx_entries_created_by ON entries(created_by);
CREATE INDEX idx_media_entry_id ON media(entry_id);
CREATE INDEX idx_bouquet_flowers_entry_id ON bouquet_flowers(entry_id);
CREATE INDEX idx_polaroid_cards_entry_id ON polaroid_cards(entry_id);
CREATE INDEX idx_scratch_cards_entry_id ON scratch_cards(entry_id);
CREATE INDEX idx_open_when_letters_entry_id ON open_when_letters(entry_id);
CREATE INDEX idx_coffee_dates_entry_id ON coffee_dates(entry_id);
CREATE INDEX idx_voice_notes_entry_id ON voice_notes(entry_id);
CREATE INDEX idx_partner_interactions_entry_id ON partner_interactions(entry_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE bouquet_flowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE polaroid_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_when_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_settings ENABLE ROW LEVEL SECURITY;

-- Service role bypass for API routes / server-side operations
CREATE POLICY "Service role can manage profiles" ON profiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage entries" ON entries FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage media" ON media FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage bouquet_flowers" ON bouquet_flowers FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage polaroid_cards" ON polaroid_cards FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage scratch_cards" ON scratch_cards FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage open_when_letters" ON open_when_letters FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage coffee_dates" ON coffee_dates FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage voice_notes" ON voice_notes FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage partner_interactions" ON partner_interactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage relationship_settings" ON relationship_settings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Entries: Published entries viewable by all, unpublished only by creator
CREATE POLICY "Published entries are viewable by everyone" ON entries FOR SELECT USING (is_published = true OR created_by = auth.uid());
CREATE POLICY "Authenticated users can create entries" ON entries FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own entries" ON entries FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own entries" ON entries FOR DELETE USING (auth.uid() = created_by);

-- Media: Similar to entries
CREATE POLICY "Media for published entries viewable" ON media FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = media.entry_id AND (entries.is_published = true OR entries.created_by = auth.uid()))
);
CREATE POLICY "Users can manage media for own entries" ON media FOR ALL USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = media.entry_id AND entries.created_by = auth.uid())
);

-- Bouquet flowers
CREATE POLICY "Bouquet flowers for published entries viewable" ON bouquet_flowers FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = bouquet_flowers.entry_id AND (entries.is_published = true OR entries.created_by = auth.uid()))
);
CREATE POLICY "Users can manage flowers for own entries" ON bouquet_flowers FOR ALL USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = bouquet_flowers.entry_id AND entries.created_by = auth.uid())
);

-- Polaroid cards
CREATE POLICY "Polaroid cards for published entries viewable" ON polaroid_cards FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = polaroid_cards.entry_id AND (entries.is_published = true OR entries.created_by = auth.uid()))
);
CREATE POLICY "Users can manage polaroids for own entries" ON polaroid_cards FOR ALL USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = polaroid_cards.entry_id AND entries.created_by = auth.uid())
);

-- Scratch cards
CREATE POLICY "Scratch cards for published entries viewable" ON scratch_cards FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = scratch_cards.entry_id AND (entries.is_published = true OR entries.created_by = auth.uid()))
);
CREATE POLICY "Users can manage scratch cards for own entries" ON scratch_cards FOR ALL USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = scratch_cards.entry_id AND entries.created_by = auth.uid())
);

-- Open when letters
CREATE POLICY "Open when letters for published entries viewable" ON open_when_letters FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = open_when_letters.entry_id AND (entries.is_published = true OR entries.created_by = auth.uid()))
);
CREATE POLICY "Users can manage open when letters for own entries" ON open_when_letters FOR ALL USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = open_when_letters.entry_id AND entries.created_by = auth.uid())
);

-- Coffee dates
CREATE POLICY "Coffee dates for published entries viewable" ON coffee_dates FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = coffee_dates.entry_id AND (entries.is_published = true OR entries.created_by = auth.uid()))
);
CREATE POLICY "Users can manage coffee dates for own entries" ON coffee_dates FOR ALL USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = coffee_dates.entry_id AND entries.created_by = auth.uid())
);

-- Voice notes
CREATE POLICY "Voice notes for published entries viewable" ON voice_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = voice_notes.entry_id AND (entries.is_published = true OR entries.created_by = auth.uid()))
);
CREATE POLICY "Users can manage voice notes for own entries" ON voice_notes FOR ALL USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = voice_notes.entry_id AND entries.created_by = auth.uid())
);

-- Partner interactions: Anyone can insert (for analytics), only creator can read
CREATE POLICY "Anyone can record interactions" ON partner_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can view interactions" ON partner_interactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = partner_interactions.entry_id AND entries.created_by = auth.uid())
);

-- Relationship settings: Only the two partners can view/update
CREATE POLICY "Partners can view relationship settings" ON relationship_settings FOR SELECT USING (
    auth.uid() = partner_one_id OR auth.uid() = partner_two_id
);
CREATE POLICY "Partners can update relationship settings" ON relationship_settings FOR UPDATE USING (
    auth.uid() = partner_one_id OR auth.uid() = partner_two_id
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationship_settings_updated_at BEFORE UPDATE ON relationship_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;
