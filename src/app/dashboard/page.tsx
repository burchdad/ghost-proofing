import Link from "next/link";
import {
  Archive,
  Camera,
  CheckCircle2,
  Copy,
  Settings,
  ImagePlus,
  Layers,
  LogOut,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { createGalleryAction } from "@/app/dashboard/actions";
import { isPlatformAdmin, requireAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { money } from "@/lib/format";
import { galleryPublicUrl, tenantBaseUrl } from "@/lib/public-studios";
import { sql } from "@/lib/db";
import type { Gallery, Studio } from "@/lib/types";

export const dynamic = "force-dynamic";

type GallerySummary = Gallery & {
  photo_count?: string;
  paid_order_count?: string;
};

function fieldClassName() {
  return "h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-stone-950";
}

function metric(label: string, value: string, icon: React.ReactNode) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-stone-700">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await requireAdmin();
  const env = getEnv();
  const platformAdmin = isPlatformAdmin(profile);
  const [galleryResult, studioResult] = await Promise.all([
    sql<GallerySummary>(
      `select g.*,
        count(distinct p.id)::text as photo_count,
        count(distinct o.id) filter (where o.status = 'paid')::text as paid_order_count
       from galleries g
       left join photos p on p.gallery_id = g.id
       left join orders o on o.gallery_id = g.id
       where ($1::boolean = true or g.studio_id = $2)
       group by g.id
       order by g.created_at desc`,
      [platformAdmin, profile.studio_id],
    ),
    profile.studio_id
      ? sql<Studio>("select * from studios where id = $1", [profile.studio_id])
      : sql<Studio>("select * from studios order by created_at asc limit 1"),
  ]);
  const galleries = galleryResult.rows;
  const studioDefaults = studioResult.rows[0];
  const publishedCount = galleries.filter((gallery) => gallery.status === "published").length;
  const photoCount = galleries.reduce((sum, gallery) => sum + Number(gallery.photo_count ?? 0), 0);
  const paidOrderCount = galleries.reduce((sum, gallery) => sum + Number(gallery.paid_order_count ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-stone-950 text-amber-200">
              <Camera className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.22em] text-stone-500">
                {profile.branding_name}
              </span>
              <span className="block text-xl font-semibold tracking-tight">Studio proofing</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {platformAdmin ? (
              <Link
                href="/dashboard/studios"
                className="inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-stone-950"
              >
                Studios
              </Link>
            ) : null}
            <Link
              href="/dashboard/settings"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-stone-950"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <a
              href={studioDefaults ? tenantBaseUrl(studioDefaults) : "/studios"}
              className="inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-stone-950"
            >
              Client portal
            </a>
            <form action={logoutAction}>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-stone-950">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">Photographer dashboard</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-5xl">
              {platformAdmin
                ? "Manage studios, proof galleries, watermark uploads, and paid orders."
                : "Create proof galleries, watermark uploads, and track paid orders."}
            </h1>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-950 p-5 text-stone-50 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-200" />
              <p className="font-semibold">Protected delivery flow</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Originals stay private until Stripe confirms payment, then GhostPhotos issues short-lived download links.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metric("Total galleries", String(galleries.length), <Layers className="h-5 w-5" />)}
          {metric("Published", String(publishedCount), <CheckCircle2 className="h-5 w-5" />)}
          {metric("Uploaded photos", String(photoCount), <ImagePlus className="h-5 w-5" />)}
          {metric("Paid orders", String(paidOrderCount), <ShoppingBag className="h-5 w-5" />)}
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[420px_1fr]">
          <form action={createGalleryAction} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-800">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Create gallery</h2>
                <p className="text-sm text-stone-500">
                  Set the client, pricing, access, and watermark defaults for {profile.studio_name ?? "this studio"}.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Client gallery</p>
                <input name="title" required placeholder="Gallery title" className={fieldClassName()} />
                <input name="slug" placeholder="Optional URL slug" className={fieldClassName()} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <input name="customerName" required placeholder="Customer name" className={fieldClassName()} />
                  <input name="customerEmail" required type="email" placeholder="Customer email" className={fieldClassName()} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold text-stone-600">
                    Expires
                    <input name="expiresAt" type="date" className={fieldClassName()} />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-600">
                    Password
                    <input name="password" type="password" placeholder="Optional" className={fieldClassName()} />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-sm font-semibold text-stone-600">
                    Per photo
                    <input
                      name="defaultPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={((studioDefaults?.default_price_cents ?? 2500) / 100).toString()}
                      className={fieldClassName()}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-600">
                    Full gallery
                    <input
                      name="fullGalleryPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={
                        studioDefaults?.default_full_gallery_price_cents
                          ? (studioDefaults.default_full_gallery_price_cents / 100).toString()
                          : undefined
                      }
                      placeholder="225"
                      className={fieldClassName()}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Watermark</p>
                <input
                  name="watermarkText"
                  defaultValue={studioDefaults?.default_watermark_text ?? "PROOF - PURCHASE TO DOWNLOAD"}
                  className={fieldClassName()}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select name="watermarkLayout" defaultValue={studioDefaults?.default_watermark_layout ?? "tile"} className={fieldClassName()}>
                    <option value="tile">Tiled diagonal</option>
                    <option value="center">Large center</option>
                  </select>
                  <input name="watermarkOpacity" type="number" min="0.05" max="0.8" step="0.01" defaultValue={studioDefaults?.default_watermark_opacity ?? "0.28"} className={fieldClassName()} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input name="watermarkSize" type="number" defaultValue={studioDefaults?.default_watermark_size ?? 180} className={fieldClassName()} />
                  <input name="watermarkSpacing" type="number" defaultValue={studioDefaults?.default_watermark_spacing ?? 320} className={fieldClassName()} />
                  <input name="watermarkAngle" type="number" defaultValue={studioDefaults?.default_watermark_angle ?? -32} className={fieldClassName()} />
                </div>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Download limit per paid order
                  <input name="downloadLimit" type="number" min="1" defaultValue={studioDefaults?.default_download_limit ?? 5} className={fieldClassName()} />
                </label>
              </div>
            </div>

            <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800">
              <Sparkles className="h-4 w-4 text-amber-200" />
              Create gallery
            </button>
          </form>

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Galleries</h2>
                <p className="text-sm text-stone-500">Open a gallery to upload photos, publish, and review orders.</p>
              </div>
            </div>

            {galleries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
                <Archive className="mx-auto h-9 w-9 text-stone-400" />
                <h3 className="mt-4 text-lg font-semibold">No galleries yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
                  Create your first proof gallery, then upload originals on the next screen.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {galleries.map((gallery) => {
                  const galleryUrl = studioDefaults ? galleryPublicUrl(studioDefaults, gallery.slug) : `${env.APP_URL}/gallery/${gallery.slug}`;
                  return (
                    <Link
                      key={gallery.id}
                      href={`/dashboard/galleries/${gallery.slug}`}
                      className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:border-stone-950"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold tracking-tight">{gallery.title}</h3>
                            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-600">
                              {gallery.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-stone-500">
                            {gallery.customer_name} / {gallery.customer_email}
                          </p>
                          <p className="mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-600">
                            <Copy className="h-4 w-4 shrink-0" />
                            <span className="truncate">{galleryUrl}</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <span className="rounded-lg bg-stone-50 px-3 py-2">
                            <b className="block text-lg">{gallery.photo_count ?? "0"}</b>
                            <small className="text-stone-500">photos</small>
                          </span>
                          <span className="rounded-lg bg-stone-50 px-3 py-2">
                            <b className="block text-lg">{gallery.paid_order_count ?? "0"}</b>
                            <small className="text-stone-500">paid</small>
                          </span>
                          <span className="rounded-lg bg-stone-50 px-3 py-2">
                            <b className="block text-lg">{money(gallery.default_price_cents)}</b>
                            <small className="text-stone-500">each</small>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
