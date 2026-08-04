import "server-only";

import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import { assertPhotoFile, makePreview } from "@/lib/images";
import { putBlob } from "@/lib/storage";
import type { Gallery } from "@/lib/types";

export async function getOwnedGallery(slug: string, profile: { id: string; role: string; studio_id: string | null }) {
  const params: unknown[] = [slug];
  const where =
    profile.role === "platform_admin"
      ? "slug = $1"
      : "slug = $1 and studio_id = $2";
  if (profile.role !== "platform_admin") {
    params.push(profile.studio_id);
  }
  const { rows } = await sql<Gallery>(
    `select * from galleries where ${where}`,
    params,
  );
  return rows[0] ?? null;
}

export async function processGalleryPhotos({
  gallery,
  files,
}: {
  gallery: Gallery;
  files: File[];
}) {
  const env = getEnv();
  let processed = 0;
  for (const file of files) {
    assertPhotoFile(file);
    const original = Buffer.from(await file.arrayBuffer());
    const preview = await makePreview(original, gallery);
    const photoId = randomUUID();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const originalKey = `studios/${gallery.studio_id}/galleries/${gallery.id}/originals/${photoId}.${extension}`;
    const previewKey = `studios/${gallery.studio_id}/galleries/${gallery.id}/previews/${photoId}.jpg`;
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
       (id, studio_id, gallery_id, original_key, preview_key, filename, content_type, size_bytes, width, height)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        photoId,
        gallery.studio_id,
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
    processed += 1;
  }
  return processed;
}
