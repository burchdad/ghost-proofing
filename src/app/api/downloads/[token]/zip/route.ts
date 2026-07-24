import { ZipArchive } from "archiver";
import { NextResponse } from "next/server";
import { PassThrough, Readable } from "node:stream";
import { getDownloadPhotos, getDownloadRecord } from "@/lib/downloads";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import { getBlobStream } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const record = await getDownloadRecord(token);
  if (!record) return NextResponse.json({ error: "Download is not authorized." }, { status: 403 });
  const photos = await getDownloadPhotos(record.order_id);
  const output = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (error) => output.destroy(error));
  archive.pipe(output);
  const env = getEnv();
  queueMicrotask(async () => {
    try {
      for (const photo of photos) {
        const stream = await getBlobStream(env.BLOB_ORIGINALS_BUCKET, photo.original_key);
        archive.append(stream, { name: photo.filename });
      }
      await archive.finalize();
      await sql(
        "update download_tokens set download_count = download_count + 1, last_accessed_at = now() where id = $1",
        [record.token_id],
      );
    } catch (error) {
      output.destroy(error as Error);
    }
  });
  return new NextResponse(Readable.toWeb(output) as ReadableStream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${record.gallery_slug}-originals.zip"`,
    },
  });
}
