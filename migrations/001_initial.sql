create extension if not exists pgcrypto;

do $$ begin
  create type gallery_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'expired', 'refunded');
exception when duplicate_object then null;
end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  role text not null check (role in ('admin', 'customer')) default 'admin',
  password_hash text,
  branding_name text not null default 'GhostPhotos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text not null unique,
  title text not null,
  customer_name text not null,
  customer_email text not null,
  expires_at timestamptz,
  password_hash text,
  status gallery_status not null default 'draft',
  default_price_cents integer not null default 2500 check (default_price_cents >= 0),
  full_gallery_price_cents integer check (full_gallery_price_cents is null or full_gallery_price_cents >= 0),
  watermark_text text not null default 'PROOF - PURCHASE TO DOWNLOAD',
  watermark_logo_key text,
  watermark_opacity numeric(4,2) not null default 0.28,
  watermark_size integer not null default 180,
  watermark_spacing integer not null default 320,
  watermark_angle integer not null default -32,
  watermark_layout text not null check (watermark_layout in ('center', 'tile')) default 'tile',
  download_limit integer not null default 5 check (download_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  original_key text not null,
  preview_key text not null,
  filename text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width integer,
  height integer,
  price_cents integer check (price_cents is null or price_cents >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete restrict,
  customer_email text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status order_status not null default 'pending',
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'usd',
  purchased_full_gallery boolean not null default false,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete restrict,
  unit_amount_cents integer not null check (unit_amount_cents >= 0),
  created_at timestamptz not null default now(),
  unique(order_id, photo_id)
);

create table if not exists download_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_downloads integer not null default 5,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz
);

create index if not exists galleries_owner_id_idx on galleries(owner_id);
create index if not exists galleries_slug_idx on galleries(slug);
create index if not exists photos_gallery_id_idx on photos(gallery_id);
create index if not exists orders_gallery_id_idx on orders(gallery_id);
create index if not exists orders_customer_email_idx on orders(customer_email);
create index if not exists order_items_order_id_idx on order_items(order_id);
create index if not exists order_items_photo_id_idx on order_items(photo_id);
create index if not exists download_tokens_order_id_idx on download_tokens(order_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles
for each row execute function set_updated_at();

drop trigger if exists galleries_set_updated_at on galleries;
create trigger galleries_set_updated_at before update on galleries
for each row execute function set_updated_at();
