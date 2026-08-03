import Link from "next/link";
import { ArrowLeft, CalendarClock, Copy, ExternalLink, Images, ShoppingBag, ShieldCheck } from "lucide-react";
import { PhotoUploadForm } from "@/app/dashboard/galleries/[slug]/PhotoUploadForm";
import { updateGalleryStatusAction } from "@/app/dashboard/actions";
import { requireAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { money } from "@/lib/format";
import { sql } from "@/lib/db";
import type { Gallery, Order, Photo } from "@/lib/types";

export const dynamic = "force-dynamic";

function statusButtonClass(current: string, status: string) {
  if (current === status) {
    return "h-10 rounded-lg border border-stone-950 bg-stone-950 px-3 text-sm font-semibold capitalize text-white";
  }
  return "h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold capitalize text-stone-700 hover:border-stone-950";
}

export default async function GalleryAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const profile = await requireAdmin();
  const { slug } = await params;
  const { rows } = await sql<Gallery>(
    "select * from galleries where slug = $1 and owner_id = $2",
    [slug, profile.id],
  );
  const gallery = rows[0];
  if (!gallery) {
    return <main className="p-8 text-stone-100">Gallery not found.</main>;
  }
  const [photoResult, orderResult] = await Promise.all([
    sql<Photo>("select * from photos where gallery_id = $1 order by sort_order, created_at", [gallery.id]),
    sql<Order>("select * from orders where gallery_id = $1 order by created_at desc limit 20", [gallery.id]),
  ]);
  const photos = photoResult.rows;
  const orders = orderResult.rows;
  const env = getEnv();
  const galleryUrl = `${env.APP_URL}/gallery/${gallery.slug}`;
  const paidOrders = orders.filter((order) => order.status === "paid").length;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="border-b border-stone-200 pb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">{profile.branding_name}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">{gallery.title}</h1>
              <a
                href={galleryUrl}
                className="mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-lg bg-white px-3 py-2 text-sm font-semibold text-stone-600 ring-1 ring-stone-200 hover:text-stone-950"
              >
                <Copy className="h-4 w-4 shrink-0" />
                <span className="truncate">{galleryUrl}</span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["draft", "published", "archived"] as const).map((status) => (
                <form key={status} action={updateGalleryStatusAction}>
                  <input type="hidden" name="slug" value={gallery.slug} />
                  <input type="hidden" name="status" value={status} />
                  <button className={statusButtonClass(gallery.status, status)}>{status}</button>
                </form>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <Images className="h-5 w-5 text-stone-500" />
            <p className="mt-3 text-3xl font-semibold">{photos.length}</p>
            <p className="text-sm text-stone-500">uploaded photos</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <ShoppingBag className="h-5 w-5 text-stone-500" />
            <p className="mt-3 text-3xl font-semibold">{paidOrders}</p>
            <p className="text-sm text-stone-500">paid orders</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-stone-500" />
            <p className="mt-3 text-3xl font-semibold">{money(gallery.default_price_cents)}</p>
            <p className="text-sm text-stone-500">per-photo price</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <CalendarClock className="h-5 w-5 text-stone-500" />
            <p className="mt-3 text-3xl font-semibold">{gallery.download_limit}</p>
            <p className="text-sm text-stone-500">downloads per token</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <PhotoUploadForm slug={gallery.slug} />
            <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm shadow-sm">
              <h2 className="font-semibold">Gallery settings</h2>
              <dl className="mt-4 grid gap-3 text-stone-600">
                <div className="flex justify-between gap-3">
                  <dt>Customer</dt>
                  <dd className="text-right font-medium text-stone-950">{gallery.customer_name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Email</dt>
                  <dd className="text-right font-medium text-stone-950">{gallery.customer_email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Full gallery</dt>
                  <dd className="font-medium text-stone-950">
                    {gallery.full_gallery_price_cents ? money(gallery.full_gallery_price_cents) : "Disabled"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Watermark</dt>
                  <dd className="text-right font-medium capitalize text-stone-950">{gallery.watermark_layout}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-8">
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Photos</h2>
                  <p className="text-sm text-stone-500">Watermarked previews are what customers see before checkout.</p>
                </div>
              </div>
              {photos.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <Images className="mx-auto h-9 w-9 text-stone-400" />
                  <h3 className="mt-4 font-semibold">No photos uploaded yet</h3>
                  <p className="mt-2 text-sm text-stone-500">Upload originals to generate watermarked previews.</p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {photos.map((photo) => (
                    <figure key={photo.id} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/blob/preview/${photo.id}`} alt={photo.filename} className="aspect-[4/3] w-full object-cover" />
                      <figcaption className="flex items-center justify-between gap-3 p-3 text-sm">
                        <span className="truncate font-medium text-stone-700">{photo.filename}</span>
                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-semibold text-stone-950 ring-1 ring-stone-200">
                          {money(photo.price_cents ?? gallery.default_price_cents)}
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Recent orders</h2>
              <p className="text-sm text-stone-500">Paid orders unlock protected original downloads.</p>
              <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
                {orders.length === 0 ? (
                  <p className="bg-stone-50 p-5 text-sm text-stone-500">No orders yet.</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="grid gap-2 border-b border-stone-200 p-4 text-sm last:border-b-0 sm:grid-cols-4">
                      <span className="font-medium text-stone-950">{order.customer_email}</span>
                      <span className="capitalize text-stone-600">{order.status}</span>
                      <span className="font-semibold">{money(order.total_cents, order.currency)}</span>
                      <span className="text-stone-500">{order.paid_at ? new Date(order.paid_at).toLocaleString() : "Awaiting payment"}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
