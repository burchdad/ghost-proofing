import { headers } from "next/headers";
import { sql } from "@/lib/db";
import { getEnv } from "@/lib/env";
import type { Studio } from "@/lib/types";

export type PublicGalleryRow = {
  id: string;
  slug: string;
  title: string;
  customer_name: string;
  expires_at: string | null;
  photo_count: string;
  preview_photo_id: string | null;
  has_password: boolean;
};

export type PublicStudioSummary = {
  id: string;
  name: string;
  public_name: string;
  slug: string;
  subdomain: string;
  custom_domain: string | null;
  contact_email: string | null;
  logo_url: string | null;
  brand_color: string;
  published_gallery_count: string;
  latest_gallery_title: string | null;
  latest_gallery_slug: string | null;
  preview_photo_id: string | null;
};

export function normalizeHost(value: string | null) {
  return (value ?? "").split(":")[0].toLowerCase().replace(/^www\./, "");
}

export function platformBaseUrl() {
  return getEnv().APP_URL.replace(/\/$/, "");
}

export function tenantBaseUrl(studio: Pick<Studio, "slug" | "subdomain" | "custom_domain">) {
  const env = getEnv();
  if (studio.custom_domain) {
    return `https://${studio.custom_domain}`;
  }
  if (env.GHOSTPHOTOS_ROOT_DOMAIN && studio.subdomain) {
    return `https://${studio.subdomain}.${env.GHOSTPHOTOS_ROOT_DOMAIN}`;
  }
  return `${platformBaseUrl()}/studio/${studio.slug}`;
}

export function galleryPublicUrl(studio: Pick<Studio, "slug" | "subdomain" | "custom_domain">, gallerySlug: string) {
  const env = getEnv();
  if (studio.custom_domain || env.GHOSTPHOTOS_ROOT_DOMAIN) {
    return `${tenantBaseUrl(studio)}/gallery/${gallerySlug}`;
  }
  return `${platformBaseUrl()}/gallery/${gallerySlug}`;
}

export async function requestHost() {
  const headerStore = await headers();
  return normalizeHost(headerStore.get("x-forwarded-host") ?? headerStore.get("host"));
}

export async function getStudioBySlug(slug: string) {
  const { rows } = await sql<Studio>("select * from studios where slug = $1 or subdomain = $1", [slug]);
  return rows[0] ?? null;
}

export async function getStudioByHost(host: string) {
  const env = getEnv();
  const rootDomain = normalizeHost(env.GHOSTPHOTOS_ROOT_DOMAIN ?? "ghostphotos.com");
  const normalizedHost = normalizeHost(host);
  const subdomain =
    rootDomain && normalizedHost.endsWith(`.${rootDomain}`)
      ? normalizedHost.slice(0, -rootDomain.length - 1)
      : null;

  const { rows } = await sql<Studio>(
    `select * from studios
     where lower(custom_domain) = lower($1)
        or ($2::text is not null and lower(subdomain) = lower($2))
     limit 1`,
    [normalizedHost, subdomain],
  );

  return rows[0] ?? null;
}

export async function getPublishedGalleries(studioId: string) {
  const { rows } = await sql<PublicGalleryRow>(
    `select
      g.id,
      g.slug,
      g.title,
      g.customer_name,
      g.expires_at,
      count(p.id)::text as photo_count,
      (
        select first_photo.id
        from photos first_photo
        where first_photo.gallery_id = g.id and first_photo.studio_id = g.studio_id
        order by first_photo.sort_order, first_photo.created_at
        limit 1
      ) as preview_photo_id,
      (g.password_hash is not null) as has_password
     from galleries g
     left join photos p on p.gallery_id = g.id and p.studio_id = g.studio_id
     where g.studio_id = $1 and g.status = 'published'
     group by g.id
     order by g.created_at desc`,
    [studioId],
  );
  return rows;
}

export async function getPublicStudioSummaries() {
  const { rows } = await sql<PublicStudioSummary>(
    `select
      s.id,
      s.name,
      s.public_name,
      s.slug,
      s.subdomain,
      s.custom_domain,
      s.contact_email,
      s.logo_url,
      s.brand_color,
      count(distinct g.id)::text as published_gallery_count,
      (
        select lg.title
        from galleries lg
        where lg.studio_id = s.id and lg.status = 'published'
        order by lg.created_at desc
        limit 1
      ) as latest_gallery_title,
      (
        select lg.slug
        from galleries lg
        where lg.studio_id = s.id and lg.status = 'published'
        order by lg.created_at desc
        limit 1
      ) as latest_gallery_slug,
      (
        select p.id
        from galleries lg
        join photos p on p.gallery_id = lg.id and p.studio_id = lg.studio_id
        where lg.studio_id = s.id and lg.status = 'published'
        order by lg.created_at desc, p.sort_order, p.created_at
        limit 1
      ) as preview_photo_id
     from studios s
     join galleries g on g.studio_id = s.id and g.status = 'published'
     group by s.id
     order by max(g.created_at) desc`,
  );
  return rows;
}
