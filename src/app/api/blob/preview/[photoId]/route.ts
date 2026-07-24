import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import { getBlobStream } from "@/lib/storage";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await params;
  const { rows } = await sql<Photo>("select * from photos where id = $1", [photoId]);
  const photo = rows[0];
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const stream = await getBlobStream(getEnv().BLOB_PREVIEWS_BUCKET, photo.preview_key);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
