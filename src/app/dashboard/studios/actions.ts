"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashSecret, requirePlatformAdmin } from "@/lib/auth";
import { safeSlug } from "@/lib/format";
import { sql } from "@/lib/db";

function cents(value: FormDataEntryValue | null, fallback: number) {
  const amount = Number(value || fallback);
  return Math.max(0, Math.round(amount * 100));
}

function normalizeCustomDomain(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) {
    return null;
  }
  return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

export async function createStudioMemberAction(formData: FormData) {
  await requirePlatformAdmin();
  const studioName = String(formData.get("studioName") ?? "").trim();
  const photographerName = String(formData.get("photographerName") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!studioName || !photographerName || !email || password.length < 8) {
    throw new Error("Studio name, photographer name, email, and an 8+ character password are required.");
  }

  const baseSlug = safeSlug(String(formData.get("studioSlug") || studioName));
  const slug = `${baseSlug || "studio"}-${randomUUID().slice(0, 6)}`;
  const subdomain = safeSlug(String(formData.get("subdomain") || baseSlug || studioName));
  const publicName = String(formData.get("publicName") || studioName).trim();
  const customDomain = normalizeCustomDomain(formData.get("customDomain"));
  const brandColor = String(formData.get("brandColor") || "#f7c948").trim();
  const watermarkText = String(formData.get("watermarkText") || `${studioName.toUpperCase()} PROOF`);
  const passwordHash = await hashSecret(password);

  const studio = await sql<{ id: string }>(
    `insert into studios (
      name, public_name, slug, subdomain, custom_domain, brand_color, contact_email,
      default_branding_name, default_price_cents, default_full_gallery_price_cents,
      default_watermark_text
    )
    values ($1,$2,$3,$4,$5,$6,$7,$2,$8,$9,$10)
    returning id`,
    [
      studioName,
      publicName,
      slug,
      subdomain,
      customDomain,
      brandColor,
      email,
      cents(formData.get("defaultPrice"), 25),
      formData.get("fullGalleryPrice") ? cents(formData.get("fullGalleryPrice"), 225) : null,
      watermarkText,
    ],
  );

  await sql(
    `insert into profiles (email, display_name, role, password_hash, studio_id, branding_name)
     values ($1,$2,'photographer',$3,$4,$5)
     on conflict (email) do update set
      display_name = excluded.display_name,
      role = 'photographer',
      password_hash = excluded.password_hash,
      studio_id = excluded.studio_id,
      branding_name = excluded.branding_name`,
    [email, photographerName, passwordHash, studio.rows[0].id, studioName],
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/studios");
  revalidatePath("/studios");
  redirect("/dashboard/studios");
}
