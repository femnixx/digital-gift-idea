-- =============================================
-- KEEPSAKE OPEN SKY - INITIAL SCHEMA
-- =============================================

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  giver_id uuid references users(id) on delete cascade,
  type text not null check (type in ('letter','memory_book','coupons','reasons','mixtape','open_when','countdown','quiz','hunt','date_jar')),
  title text not null,
  recipient_name text,
  note text,
  wrap_style text not null default 'airmail',
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  slug text unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$'),
  slug_is_custom boolean not null default false,
  pin_hash text,
  unlock_at timestamptz,
  indexable boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gifts_giver_idx on gifts(giver_id);
create index if not exists gifts_slug_idx on gifts(slug);

create table if not exists slug_history (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  old_slug text not null unique,
  retired_at timestamptz not null default now()
);

create table if not exists gift_items (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  kind text not null,
  position int not null,
  payload jsonb not null default '{}',
  unlock_at timestamptz,
  unique (gift_id, position)
);

create table if not exists gift_versions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists reveals (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  visitor_id text not null,
  opened_at timestamptz not null default now(),
  seconds_viewed int
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  gift_item_id uuid not null references gift_items(id) on delete cascade,
  visitor_id text not null,
  stamp text not null,
  created_at timestamptz not null default now(),
  unique (gift_item_id, visitor_id)
);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  message text not null check (char_length(message) <= 2000),
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  author_name text not null,
  message text not null check (char_length(message) <= 1000),
  media_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  gift_item_id uuid not null unique references gift_items(id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  answers jsonb not null,
  score int not null,
  created_at timestamptz not null default now()
);

create table if not exists drawer (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  gift_id uuid not null references gifts(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (user_id, gift_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label text not null,
  occasion_date date not null,
  notify_days int[] not null default '{14,3}'
);

create table if not exists pin_attempts (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references gifts(id) on delete cascade,
  visitor_id text not null,
  attempted_at timestamptz not null default now()
);
