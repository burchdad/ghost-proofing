import { NextResponse } from "next/server";
import { getPublicStudioSummaries, platformBaseUrl, tenantBaseUrl } from "@/lib/public-studios";

export const runtime = "nodejs";

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
  const appUrl = platformBaseUrl();
  const rows = await getPublicStudioSummaries();

  return NextResponse.json(
    {
      studios: rows.map((studio) => ({
        id: studio.id,
        name: studio.public_name,
        slug: studio.slug,
        subdomain: studio.subdomain,
        customDomain: studio.custom_domain,
        contactEmail: studio.contact_email,
        publishedGalleryCount: Number(studio.published_gallery_count),
        latestGalleryTitle: studio.latest_gallery_title,
        latestGalleryUrl: studio.latest_gallery_slug
          ? `${appUrl}/gallery/${studio.latest_gallery_slug}`
          : null,
        clientPortalUrl: tenantBaseUrl(studio),
        previewImageUrl: studio.preview_photo_id
          ? `${appUrl}/api/blob/preview/${studio.preview_photo_id}`
          : null,
      })),
    },
    { headers: corsHeaders() },
  );
}
