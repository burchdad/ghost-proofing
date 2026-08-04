import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getOwnedGallery, processGalleryPhotos } from "@/lib/gallery-uploads";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !["platform_admin", "photographer", "assistant", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const { slug } = await params;
  const gallery = await getOwnedGallery(slug, profile);
  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }
  const formData = await request.formData();
  const files = formData
    .getAll("photos")
    .filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "Choose at least one image." }, { status: 400 });
  }
  try {
    const processed = await processGalleryPhotos({ gallery, files });
    revalidatePath(`/dashboard/galleries/${slug}`);
    return NextResponse.json({ processed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
