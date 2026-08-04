"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, hashSecret } from "@/lib/auth";
import { safeSlug } from "@/lib/format";
import { sql } from "@/lib/db";
import { getOwnedGallery, processGalleryPhotos } from "@/lib/gallery-uploads";

export async function createGalleryAction(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile.studio_id) {
    throw new Error("Your account is not attached to a studio.");
  }
  const title = String(formData.get("title") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").toLowerCase().trim();
  if (!title || !customerName || !customerEmail) {
    throw new Error("Title, customer name, and customer email are required.");
  }
  const baseSlug = safeSlug(String(formData.get("slug") ?? title));
  const slug = `${baseSlug || "gallery"}-${randomUUID().slice(0, 8)}`;
  const password = String(formData.get("password") ?? "");
  const passwordHash = password ? await hashSecret(password) : null;

  const studioDefaults = await sql<{
    default_price_cents: number;
    default_full_gallery_price_cents: number | null;
    default_watermark_text: string;
    default_watermark_opacity: string;
    default_watermark_size: number;
    default_watermark_spacing: number;
    default_watermark_angle: number;
    default_watermark_layout: string;
    default_download_limit: number;
  }>(
    `select default_price_cents, default_full_gallery_price_cents, default_watermark_text,
      default_watermark_opacity, default_watermark_size, default_watermark_spacing,
      default_watermark_angle, default_watermark_layout, default_download_limit
     from studios where id = $1`,
    [profile.studio_id],
  );
  const defaults = studioDefaults.rows[0];

  await sql(
    `insert into galleries (
      studio_id, owner_id, slug, title, customer_name, customer_email, expires_at,
      password_hash, default_price_cents, full_gallery_price_cents, watermark_text,
      watermark_opacity, watermark_size, watermark_spacing, watermark_angle, watermark_layout,
      download_limit
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      profile.studio_id,
      profile.id,
      slug,
      title,
      customerName,
      customerEmail,
      String(formData.get("expiresAt") || "") || null,
      passwordHash,
      Math.round(Number(formData.get("defaultPrice") || (defaults?.default_price_cents ?? 2500) / 100) * 100),
      formData.get("fullGalleryPrice")
        ? Math.round(Number(formData.get("fullGalleryPrice")) * 100)
        : defaults?.default_full_gallery_price_cents ?? null,
      String(formData.get("watermarkText") || defaults?.default_watermark_text || "PROOF - PURCHASE TO DOWNLOAD"),
      Number(formData.get("watermarkOpacity") || defaults?.default_watermark_opacity || 0.28),
      Number(formData.get("watermarkSize") || defaults?.default_watermark_size || 180),
      Number(formData.get("watermarkSpacing") || defaults?.default_watermark_spacing || 320),
      Number(formData.get("watermarkAngle") || defaults?.default_watermark_angle || -32),
      String(formData.get("watermarkLayout") || defaults?.default_watermark_layout || "tile"),
      Number(formData.get("downloadLimit") || defaults?.default_download_limit || 5),
    ],
  );
  revalidatePath("/dashboard");
  redirect(`/dashboard/galleries/${slug}`);
}

export async function updateGalleryStatusAction(formData: FormData) {
  const profile = await requireAdmin();
  const slug = String(formData.get("slug"));
  const status = String(formData.get("status"));
  if (profile.role === "platform_admin") {
    await sql("update galleries set status = $1 where slug = $2", [status, slug]);
  } else {
    await sql("update galleries set status = $1 where slug = $2 and studio_id = $3", [
      status,
      slug,
      profile.studio_id,
    ]);
  }
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/galleries/${slug}`);
}

export async function uploadPhotosAction(formData: FormData) {
  const profile = await requireAdmin();
  const slug = String(formData.get("slug"));
  const gallery = await getOwnedGallery(slug, profile);
  if (!gallery) throw new Error("Gallery not found.");
  const files = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
  await processGalleryPhotos({ gallery, files });
  revalidatePath(`/dashboard/galleries/${slug}`);
}
