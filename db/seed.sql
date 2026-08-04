insert into profiles (email, display_name, role, branding_name)
values ('studio@example.com', 'Studio Admin', 'admin', 'GhostPhotos')
on conflict (email) do nothing;

insert into galleries (
  owner_id,
  slug,
  title,
  customer_name,
  customer_email,
  status,
  default_price_cents,
  full_gallery_price_cents,
  watermark_text
)
select
  id,
  'sample-proofing-gallery',
  'Sample Proofing Gallery',
  'Avery Stone',
  'avery@example.com',
  'draft',
  3500,
  22500,
  'PROOF - PURCHASE TO DOWNLOAD'
from profiles
where email = 'studio@example.com'
on conflict (slug) do nothing;
