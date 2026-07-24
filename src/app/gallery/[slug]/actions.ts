"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  galleryAccessCookieName,
  signGalleryAccess,
  verifySecret,
} from "@/lib/auth";
import { sql } from "@/lib/db";

type GalleryPasswordRecord = {
  id: string;
  slug: string;
  password_hash: string | null;
};

export async function unlockGalleryAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const { rows } = await sql<GalleryPasswordRecord>(
    "select id, slug, password_hash from galleries where slug = $1 and status = 'published'",
    [slug],
  );
  const gallery = rows[0];
  if (!gallery || !(await verifySecret(password, gallery.password_hash))) {
    redirect(`/gallery/${slug}?error=password`);
  }
  const jar = await cookies();
  jar.set(galleryAccessCookieName(gallery.id), signGalleryAccess(gallery.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/gallery/${gallery.slug}`,
    maxAge: 60 * 60 * 24,
  });
  redirect(`/gallery/${gallery.slug}`);
}
