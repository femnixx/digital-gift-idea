-- =============================================
-- 002 - TABLES FOR THE REMAINING GIFT TYPES
-- =============================================
--
-- The gift catalogue lists eleven types. Eight had a table in the database;
-- coupon booklet, reasons and mixtape only existed in the type union, so a
-- gift of those types had nowhere to store its contents and the admin health
-- check reported them as down.
--
-- The shapes follow the tables that already exist: one row per item, an
-- optional link back to the parent entry, and a sort_order so the recipient
-- sees them in the order the giver arranged them.

create table if not exists coupon_booklets (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  title text not null,
  description text,
  terms text,
  is_redeemed boolean not null default false,
  redeemed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_coupon_booklets_entry on coupon_booklets(entry_id, sort_order);

create table if not exists reason_cards (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  text text not null,
  illustration_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reason_cards_entry on reason_cards(entry_id, sort_order);

create table if not exists mixtape_tracks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  title text not null,
  artist text,
  url text,
  note text,
  side text not null default 'A',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_mixtape_tracks_entry on mixtape_tracks(entry_id, sort_order);
