-- =============================================
-- LOVE DIARIES TABLE
-- =============================================
CREATE TABLE love_diaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    entry_ids UUID[] DEFAULT '{}',
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_love_diaries_user_id ON love_diaries(user_id);
CREATE INDEX idx_love_diaries_entry_ids ON love_diaries USING gin(entry_ids);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_love_diaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_love_diaries_updated_at
    BEFORE UPDATE ON love_diaries
    FOR EACH ROW
    EXECUTE FUNCTION update_love_diaries_updated_at();

-- Enable Row Level Security
ALTER TABLE love_diaries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own diaries"
    ON love_diaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own diaries"
    ON love_diaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diaries"
    ON love_diaries FOR DELETE
    USING (auth.uid() = user_id);

-- Function to add entry to diary
CREATE OR REPLACE FUNCTION add_entry_to_diary(diary_uuid UUID, entry_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE love_diaries
    SET entry_ids = array_append(entry_ids, entry_uuid)
    WHERE id = diary_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove entry from diary
CREATE OR REPLACE FUNCTION remove_entry_from_diary(diary_uuid UUID, entry_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE love_diaries
    SET entry_ids = array_remove(entry_ids, entry_uuid)
    WHERE id = diary_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
