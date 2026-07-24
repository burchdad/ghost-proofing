import "server-only";

import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import { assertPhotoFile, makePreview } from "@/lib/images";
import { putBlob } from "@/lib/storage";
import type { Gallery } from "@/lib/types";

export async function getOwnedGallery(slug: string, ownerId: string) {
  const { rows } = await sql<Gallery>(
    "select * from galleries where slug = $1 and owner_id = $2",
    [slug, ownerId],
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
    processed += 1;
  }
  return processed;
}
