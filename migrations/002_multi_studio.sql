create table if not exists studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  contact_email text,
  default_branding_name text not null default 'GhostPhotos',
  default_price_cents integer not null default 2500 check (default_price_cents >= 0),
  default_full_gallery_price_cents integer check (default_full_gallery_price_cents is null or default_full_gallery_price_cents >= 0),
  default_watermark_text text not null default 'PROOF - PURCHASE TO DOWNLOAD',
  default_watermark_opacity numeric(4,2) not null default 0.28,
  default_watermark_size integer not null default 180,
  default_watermark_spacing integer not null default 320,
  default_watermark_angle integer not null default -32,
  default_watermark_layout text not null check (default_watermark_layout in ('center', 'tile')) default 'tile',
  default_download_limit integer not null default 5 check (default_download_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('platform_admin', 'photographer', 'assistant', 'admin', 'customer'));

alter table profiles add column if not exists studio_id uuid references studios(id) on delete set null;
alter table galleries add column if not exists studio_id uuid references studios(id) on delete cascade;
alter table photos add column if not exists studio_id uuid references studios(id) on delete cascade;
alter table orders add column if not exists studio_id uuid references studios(id) on delete cascade;

with existing as (
  select
    coalesce(max(branding_name), 'GhostPhotos') as branding_name,
    coalesce(min(email), 'studio@example.com') as email
  from profiles
), inserted as (
  insert into studios (
    name,
    slug,
    contact_email,
    default_branding_name
  )
  select
    existing.branding_name,
    'main-studio',
    existing.email,
    existing.branding_name
  from existing
  where not exists (select 1 from studios where slug = 'main-studio')
  returning id
)
update profiles
set studio_id = coalesce(
  profiles.studio_id,
  (select id from inserted limit 1),
  (select id from studios where slug = 'main-studio' limit 1)
);

update profiles
set role = 'platform_admin'
where role = 'admin'
  and id = (select id from profiles order by created_at asc limit 1);

update profiles
set role = 'photographer'
where role = 'admin';

update galleries
set studio_id = coalesce(
  galleries.studio_id,
  (select studio_id from profiles where profiles.id = galleries.owner_id),
  (select id from studios where slug = 'main-studio' limit 1)
);

update photos
set studio_id = coalesce(
  photos.studio_id,
  (select studio_id from galleries where galleries.id = photos.gallery_id)
);

update orders
set studio_id = coalesce(
  orders.studio_id,
  (select studio_id from galleries where galleries.id = orders.gallery_id)
);

alter table galleries alter column studio_id set not null;
alter table photos alter column studio_id set not null;
alter table orders alter column studio_id set not null;

create index if not exists profiles_studio_id_idx on profiles(studio_id);
create index if not exists galleries_studio_id_idx on galleries(studio_id);
create index if not exists photos_studio_id_idx on photos(studio_id);
create index if not exists orders_studio_id_idx on orders(studio_id);

drop trigger if exists studios_set_updated_at on studios;
create trigger studios_set_updated_at before update on studios
for each row execute function set_updated_at();
