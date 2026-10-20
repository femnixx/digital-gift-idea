-- Migration: Keepsake digital gifts core tables
--
-- Adds the gifts, gift_items, reveals, replies, keepsake_drawer and
-- coupon_redemptions tables plus slug_history for redirect support.
-- Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    slug_is_custom BOOLEAN DEFAULT FALSE,
    title TEXT NOT NULL,
    recipient_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('letter','memory_book','coupon_booklet','reasons','mixtape')),
    note TEXT,
    wrap_style JSONB DEFAULT '{}',
    unlock_at TIMESTAMPTZ,
    pin_hash TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','unpublished','scheduled')),
    is_published BOOLEAN DEFAULT FALSE,
    noindex BOOLEAN DEFAULT TRUE,
    social_opt_in BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gifts_slug ON gifts(slug);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
CREATE INDEX IF NOT EXISTS idx_gifts_published_at ON gifts(published_at) WHERE is_published = TRUE;

CREATE TABLE IF NOT EXISTS slug_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    old_slug TEXT NOT NULL,
    retired_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slug_history_gift ON slug_history(gift_id);
CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug ON slug_history(old_slug);

CREATE TABLE IF NOT EXISTS gift_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('letter','photo','coupon','card','track','voice')),
    payload_json JSONB NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_items_gift ON gift_items(gift_id, position);

CREATE TABLE IF NOT EXISTS reveals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    device_info JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_reveals_gift ON reveals(gift_id);

CREATE TABLE IF NOT EXISTS replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replies_gift ON replies(gift_id);

CREATE TABLE IF NOT EXISTS keepsake_drawer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID,
    recipient_email TEXT,
    gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keepsake_drawer_recipient ON keepsake_drawer(recipient_id, recipient_email);
CREATE INDEX IF NOT EXISTS idx_keepsake_drawer_gift ON keepsake_drawer(gift_id);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_item ON coupon_redemptions(gift_item_id);
