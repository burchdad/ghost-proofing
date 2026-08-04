import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Globe2, Mail, Palette, ReceiptText } from "lucide-react";
import { updateStudioSettingsAction } from "@/app/dashboard/settings/actions";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { galleryPublicUrl, tenantBaseUrl } from "@/lib/public-studios";
import { sql } from "@/lib/db";
import type { Gallery, Studio } from "@/lib/types";

export const dynamic = "force-dynamic";

function fieldClassName() {
  return "h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-stone-950";
}

function textareaClassName() {
  return "min-h-24 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-stone-950";
}

export default async function StudioSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; welcome?: string; error?: string }>;
}) {
  const profile = await requireAdmin();
  const state = await searchParams;
  const { rows } = await sql<Studio>("select * from studios where id = $1", [profile.studio_id]);
  const studio = rows[0];
  if (!studio) {
    return <main className="p-8 text-stone-950">Studio not found.</main>;
  }
  const latestGallery = await sql<Gallery>(
    "select * from galleries where studio_id = $1 order by created_at desc limit 1",
    [studio.id],
  );
  const portalUrl = tenantBaseUrl(studio);
  const sampleGalleryUrl = latestGallery.rows[0] ? galleryPublicUrl(studio, latestGallery.rows[0].slug) : null;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="border-b border-stone-200 pb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
                {state.welcome ? "Finish setup" : "Studio settings"}
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">{studio.public_name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                Manage the client portal, default pricing, watermarking, email behavior, and policy text for this studio.
              </p>
            </div>
            <a
              href={portalUrl}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-950"
            >
              <ExternalLink className="h-4 w-4" />
              Open portal
            </a>
          </div>
        </header>

        {state.saved ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Settings saved.
          </p>
        ) : null}
        {state.error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {state.error === "taken" ? "That subdomain or custom domain is already attached to another studio." : "Check required fields and try again."}
          </p>
        ) : null}

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
          <form action={updateStudioSettingsAction} className="space-y-6">
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                <Palette className="h-5 w-5 text-stone-500" />
                <h2 className="text-xl font-semibold">Brand and portal</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Internal studio name
                  <input name="studioName" required defaultValue={studio.name} className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Public display name
                  <input name="publicName" required defaultValue={studio.public_name} className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Contact email
                  <input name="contactEmail" required type="email" defaultValue={studio.contact_email ?? profile.email} className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Logo URL
                  <input name="logoUrl" defaultValue={studio.logo_url ?? ""} placeholder="https://..." className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Brand color
                  <input name="brandColor" type="color" defaultValue={studio.brand_color} className="h-11 w-full rounded-lg border border-stone-300 bg-white px-2 py-1" />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  GhostPhotos subdomain
                  <input name="subdomain" required defaultValue={studio.subdomain} className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600 sm:col-span-2">
                  Custom domain
                  <input name="customDomain" defaultValue={studio.custom_domain ?? ""} placeholder="kbphotography.com" className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600 sm:col-span-2">
                  Client portal intro
                  <textarea name="clientIntro" defaultValue={studio.client_intro} className={textareaClassName()} />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Default gallery setup</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Per-photo price
                  <input name="defaultPrice" type="number" min="0" step="0.01" defaultValue={(studio.default_price_cents / 100).toString()} className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Full-gallery price
                  <input name="fullGalleryPrice" type="number" min="0" step="0.01" defaultValue={studio.default_full_gallery_price_cents ? (studio.default_full_gallery_price_cents / 100).toString() : ""} placeholder="225" className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600 sm:col-span-2">
                  Watermark text
                  <input name="watermarkText" defaultValue={studio.default_watermark_text} className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Watermark layout
                  <select name="watermarkLayout" defaultValue={studio.default_watermark_layout} className={fieldClassName()}>
                    <option value="tile">Tiled diagonal</option>
                    <option value="center">Large center</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Watermark opacity
                  <input name="watermarkOpacity" type="number" min="0.05" max="0.8" step="0.01" defaultValue={studio.default_watermark_opacity} className={fieldClassName()} />
                </label>
                <input name="watermarkSize" type="hidden" value={studio.default_watermark_size} />
                <input name="watermarkSpacing" type="hidden" value={studio.default_watermark_spacing} />
                <input name="watermarkAngle" type="hidden" value={studio.default_watermark_angle} />
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Download limit
                  <input name="downloadLimit" type="number" min="1" defaultValue={studio.default_download_limit} className={fieldClassName()} />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                <ReceiptText className="h-5 w-5 text-stone-500" />
                <h2 className="text-xl font-semibold">Email, payment, and policies</h2>
              </div>
              <div className="mt-5 grid gap-4">
                <label className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm font-semibold text-stone-700">
                  <input name="galleryPublishedEmailEnabled" type="checkbox" defaultChecked={studio.gallery_published_email_enabled} />
                  Email clients when a gallery is published
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Stripe/payment note
                  <textarea name="stripePaymentNote" defaultValue={studio.stripe_payment_note} className={textareaClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Refund policy
                  <textarea name="refundPolicy" defaultValue={studio.refund_policy} className={textareaClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Terms URL
                  <input name="termsUrl" defaultValue={studio.terms_url ?? ""} placeholder="https://..." className={fieldClassName()} />
                </label>
              </div>
            </section>

            <button className="h-11 rounded-lg bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800">
              Save settings
            </button>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <Globe2 className="h-5 w-5 text-stone-500" />
              <h2 className="mt-3 text-lg font-semibold">Portal links</h2>
              <a href={portalUrl} className="mt-3 block break-all text-sm font-semibold text-stone-700 hover:text-stone-950">
                {portalUrl}
              </a>
              {sampleGalleryUrl ? (
                <a href={sampleGalleryUrl} className="mt-3 block break-all text-sm text-stone-500 hover:text-stone-950">
                  Latest gallery: {sampleGalleryUrl}
                </a>
              ) : null}
            </section>
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <Mail className="h-5 w-5 text-stone-500" />
              <h2 className="mt-3 text-lg font-semibold">Readiness</h2>
              <div className="mt-4 grid gap-3 text-sm text-stone-600">
                <p>Default per-photo: <b className="text-stone-950">{money(studio.default_price_cents)}</b></p>
                <p>Full gallery: <b className="text-stone-950">{studio.default_full_gallery_price_cents ? money(studio.default_full_gallery_price_cents) : "Disabled"}</b></p>
                <p>Publish email: <b className="text-stone-950">{studio.gallery_published_email_enabled ? "On" : "Off"}</b></p>
                <p>Custom domain: <b className="text-stone-950">{studio.custom_domain ? "Entered" : "Not set"}</b></p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
