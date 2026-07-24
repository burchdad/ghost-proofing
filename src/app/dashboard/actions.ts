"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, hashSecret } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { safeSlug } from "@/lib/format";
import { assertPhotoFile, makePreview } from "@/lib/images";
import { sql } from "@/lib/db";
import { putBlob } from "@/lib/storage";
import type { Gallery } from "@/lib/types";

export async function createGalleryAction(formData: FormData) {
  const profile = await requireAdmin();
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

  await sql(
    `insert into galleries (
      owner_id, slug, title, customer_name, customer_email, expires_at,
      password_hash, default_price_cents, full_gallery_price_cents, watermark_text,
      watermark_opacity, watermark_size, watermark_spacing, watermark_angle, watermark_layout
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      profile.id,
      slug,
      title,
      customerName,
      customerEmail,
      String(formData.get("expiresAt") || "") || null,
      passwordHash,
      Math.round(Number(formData.get("defaultPrice") || 25) * 100),
      formData.get("fullGalleryPrice")
        ? Math.round(Number(formData.get("fullGalleryPrice")) * 100)
        : null,
      String(formData.get("watermarkText") || "PROOF - PURCHASE TO DOWNLOAD"),
      Number(formData.get("watermarkOpacity") || 0.28),
      Number(formData.get("watermarkSize") || 180),
      Number(formData.get("watermarkSpacing") || 320),
      Number(formData.get("watermarkAngle") || -32),
      String(formData.get("watermarkLayout") || "tile"),
    ],
  );
  revalidatePath("/dashboard");
  redirect(`/dashboard/galleries/${slug}`);
}

export async function updateGalleryStatusAction(formData: FormData) {
  const profile = await requireAdmin();
  const slug = String(formData.get("slug"));
  const status = String(formData.get("status"));
  await sql("update galleries set status = $1 where slug = $2 and owner_id = $3", [
    status,
    slug,
    profile.id,
  ]);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/galleries/${slug}`);
}

export async function uploadPhotosAction(formData: FormData) {
  const profile = await requireAdmin();
  const env = getEnv();
  const slug = String(formData.get("slug"));
  const { rows } = await sql<Gallery>(
    "select * from galleries where slug = $1 and owner_id = $2",
    [slug, profile.id],
  );
  const gallery = rows[0];
  if (!gallery) throw new Error("Gallery not found.");
  const files = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
  for (const file of files) {
    assertPhotoFile(file);
    const original = Buffer.from(await file.arrayBuffer());
    const preview = await makePreview(original, gallery);
    const photoId = randomUUID();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const originalKey = `${gallery.id}/originals/${photoId}.${extension}`;
    const previewKey = `${gallery.id}/previews/${photoId}.jpg`;
    await putBlob({
      bucket: env.BLOB_ORIGINALS_BUCKET,
      key: originalKey,
      body: original,
      contentType: file.type,
    });
    await putBlob({
      bucket: env.BLOB_PREVIEWS_BUCKET,
      key: previewKey,
      body: preview.buffer,
      contentType: preview.contentType,
    });
    await sql(
      `insert into photos
       (id, gallery_id, original_key, preview_key, filename, content_type, size_bytes, width, height)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        photoId,
        gallery.id,
        originalKey,
        previewKey,
        file.name,
        file.type,
        file.size,
        preview.width,
        preview.height,
      ],
    );
  }
  revalidatePath(`/dashboard/galleries/${slug}`);
}
