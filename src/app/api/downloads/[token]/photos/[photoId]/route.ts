import { NextResponse } from "next/server";
import { assertPaidPhotoAccess } from "@/lib/downloads";
import { getOriginalSignedUrl } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; photoId: string }> },
) {
  const { token, photoId } = await params;
  const photo = await assertPaidPhotoAccess(token, photoId);
  if (!photo) return NextResponse.json({ error: "Download is not authorized." }, { status: 403 });
  return NextResponse.redirect(await getOriginalSignedUrl(photo.original_key));
}
