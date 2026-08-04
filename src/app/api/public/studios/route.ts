import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

type StudioDirectoryRow = {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  published_gallery_count: string;
  latest_gallery_title: string | null;
  latest_gallery_slug: string | null;
  preview_photo_id: string | null;
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const env = getEnv();
  const appUrl = env.APP_URL.replace(/\/$/, "");
  const { rows } = await sql<StudioDirectoryRow>(
    `select
      s.id,
      s.name,
      s.slug,
      s.contact_email,
      count(distinct g.id)::text as published_gallery_count,
      latest.title as latest_gallery_title,
      latest.slug as latest_gallery_slug,
      latest.preview_photo_id
     from studios s
     join galleries g on g.studio_id = s.id and g.status = 'published'
     left join lateral (
      select
        lg.title,
        lg.slug,
        (
          select p.id
          from photos p
          where p.gallery_id = lg.id and p.studio_id = lg.studio_id
          order by p.sort_order, p.created_at
          limit 1
        ) as preview_photo_id
      from galleries lg
      where lg.studio_id = s.id and lg.status = 'published'
      order by lg.created_at desc
      limit 1
     ) latest on true
     group by s.id, latest.title, latest.slug, latest.preview_photo_id
     order by s.name`,
  );

  return NextResponse.json(
    {
      studios: rows.map((studio) => ({
        id: studio.id,
        name: studio.name,
        slug: studio.slug,
        contactEmail: studio.contact_email,
        publishedGalleryCount: Number(studio.published_gallery_count),
        latestGalleryTitle: studio.latest_gallery_title,
        latestGalleryUrl: studio.latest_gallery_slug
          ? `${appUrl}/gallery/${studio.latest_gallery_slug}`
          : null,
        clientPortalUrl: `${appUrl}/studio/${studio.slug}`,
        previewImageUrl: studio.preview_photo_id
          ? `${appUrl}/api/blob/preview/${studio.preview_photo_id}`
          : null,
      })),
    },
    { headers: corsHeaders() },
  );
}
