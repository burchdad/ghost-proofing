alter table studios add column if not exists public_name text;
alter table studios add column if not exists subdomain text;
alter table studios add column if not exists custom_domain text;
alter table studios add column if not exists logo_url text;
alter table studios add column if not exists brand_color text not null default '#f7c948';

update studios
set
  public_name = coalesce(public_name, name),
  subdomain = coalesce(subdomain, slug)
where public_name is null or subdomain is null;

alter table studios alter column public_name set not null;
alter table studios alter column subdomain set not null;

create unique index if not exists studios_subdomain_key on studios(lower(subdomain));
create unique index if not exists studios_custom_domain_key
  on studios(lower(custom_domain))
  where custom_domain is not null and custom_domain <> '';
