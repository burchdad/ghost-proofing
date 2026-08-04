"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  cents,
  normalizeColor,
  normalizeCustomDomain,
  normalizeOptionalUrl,
  normalizeSubdomain,
} from "@/lib/forms";
import { sql } from "@/lib/db";

export async function updateStudioSettingsAction(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile.studio_id) {
    throw new Error("Your account is not attached to a studio.");
  }

  const studioName = String(formData.get("studioName") ?? "").trim();
  const publicName = String(formData.get("publicName") ?? studioName).trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").toLowerCase().trim();
  const subdomain = normalizeSubdomain(formData.get("subdomain"), studioName);

  if (!studioName || !publicName || !contactEmail.includes("@") || !subdomain) {
    redirect("/dashboard/settings?error=invalid");
  }

  const conflict = await sql<{ id: string }>(
    `select id from studios
     where id <> $1
       and (lower(subdomain) = lower($2)
        or ($3::text is not null and lower(custom_domain) = lower($3)))`,
    [profile.studio_id, subdomain, normalizeCustomDomain(formData.get("customDomain"))],
  );
  if (conflict.rows.length > 0) {
    redirect("/dashboard/settings?error=taken");
  }

  await sql(
    `update studios set
      name = $1,
      public_name = $2,
      subdomain = $3,
      custom_domain = $4,
      logo_url = $5,
      brand_color = $6,
      contact_email = $7,
      default_branding_name = $2,
      default_price_cents = $8,
      default_full_gallery_price_cents = $9,
      default_watermark_text = $10,
      default_watermark_opacity = $11,
      default_watermark_size = $12,
      default_watermark_spacing = $13,
      default_watermark_angle = $14,
      default_watermark_layout = $15,
      default_download_limit = $16,
      client_intro = $17,
      terms_url = $18,
      refund_policy = $19,
      gallery_published_email_enabled = $20,
      stripe_payment_note = $21
     where id = $22`,
    [
      studioName,
      publicName,
      subdomain,
      normalizeCustomDomain(formData.get("customDomain")),
      normalizeOptionalUrl(formData.get("logoUrl")),
      normalizeColor(formData.get("brandColor")),
      contactEmail,
      cents(formData.get("defaultPrice"), 25),
      formData.get("fullGalleryPrice") ? cents(formData.get("fullGalleryPrice"), 225) : null,
      String(formData.get("watermarkText") || `${publicName.toUpperCase()} PROOF`),
      Number(formData.get("watermarkOpacity") || 0.28),
      Number(formData.get("watermarkSize") || 180),
      Number(formData.get("watermarkSpacing") || 320),
      Number(formData.get("watermarkAngle") || -32),
      String(formData.get("watermarkLayout") || "tile"),
      Number(formData.get("downloadLimit") || 5),
      String(formData.get("clientIntro") || "Choose your private proof gallery below.").trim(),
      normalizeOptionalUrl(formData.get("termsUrl")),
      String(formData.get("refundPolicy") || "Digital photo orders are reviewed case by case.").trim(),
      formData.get("galleryPublishedEmailEnabled") === "on",
      String(formData.get("stripePaymentNote") || "Payments are processed securely through Stripe.").trim(),
      profile.studio_id,
    ],
  );

  await sql("update profiles set branding_name = $1 where studio_id = $2", [publicName, profile.studio_id]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/studios");
  redirect("/dashboard/settings?saved=1");
}
