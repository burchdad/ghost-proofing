import "server-only";

import { tokenHash } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Photo } from "@/lib/types";

export type DownloadRecord = {
  token_id: string;
  studio_id: string;
  expires_at: string;
  max_downloads: number;
  download_count: number;
  order_id: string;
  customer_email: string;
  gallery_title: string;
  gallery_slug: string;
};

export async function getDownloadRecord(token: string): Promise<DownloadRecord | null> {
  const { rows } = await sql<DownloadRecord>(
    `select dt.id as token_id, o.studio_id, dt.expires_at, dt.max_downloads, dt.download_count,
      o.id as order_id, o.customer_email, g.title as gallery_title, g.slug as gallery_slug
     from download_tokens dt
     join orders o on o.id = dt.order_id
     join galleries g on g.id = o.gallery_id
     where dt.token_hash = $1
       and o.status = 'paid'
       and dt.expires_at > now()
       and dt.download_count < dt.max_downloads`,
    [tokenHash(token)],
  );
  return rows[0] ?? null;
}

export async function getDownloadPhotos(orderId: string): Promise<Photo[]> {
  const { rows } = await sql<Photo>(
    `select p.*
     from order_items oi
     join photos p on p.id = oi.photo_id
     join orders o on o.id = oi.order_id and o.studio_id = p.studio_id
     where oi.order_id = $1
     order by p.sort_order, p.created_at`,
    [orderId],
  );
  return rows;
}

export async function assertPaidPhotoAccess(token: string, photoId: string): Promise<Photo | null> {
  const record = await getDownloadRecord(token);
  if (!record) return null;
  const { rows } = await sql<Photo>(
    `select p.*
     from order_items oi
     join photos p on p.id = oi.photo_id
     join orders o on o.id = oi.order_id and o.studio_id = p.studio_id
     where oi.order_id = $1 and p.id = $2`,
    [record.order_id, photoId],
  );
  const photo = rows[0];
  if (!photo) return null;
  await sql(
    "update download_tokens set download_count = download_count + 1, last_accessed_at = now() where id = $1",
    [record.token_id],
  );
  return photo;
}
