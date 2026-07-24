import Link from "next/link";
import { PhotoUploadForm } from "@/app/dashboard/galleries/[slug]/PhotoUploadForm";
import { updateGalleryStatusAction } from "@/app/dashboard/actions";
import { requireAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { money } from "@/lib/format";
import { sql } from "@/lib/db";
import type { Gallery, Order, Photo } from "@/lib/types";

export const dynamic = "force-dynamic";

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
  const photos: Photo[] = photoResult.rows;
  const orders: Order[] = orderResult.rows;
  const env = getEnv();

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-stone-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-100">Back to dashboard</Link>
            <h1 className="mt-3 text-3xl font-semibold">{gallery.title}</h1>
            <p className="mt-2 text-stone-400">{env.APP_URL}/gallery/{gallery.slug}</p>
          </div>
          <div className="flex gap-2">
            {(["draft", "published", "archived"] as const).map((status) => (
              <form key={status} action={updateGalleryStatusAction}>
                <input type="hidden" name="slug" value={gallery.slug} />
                <input type="hidden" name="status" value={status} />
                <button className={`rounded-md border px-3 py-2 text-sm ${gallery.status === status ? "border-amber-200 bg-amber-200 text-black" : "border-white/15 hover:bg-white/10"}`}>
                  {status}
                </button>
              </form>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <PhotoUploadForm slug={gallery.slug} />
            <div className="rounded-md border border-white/10 p-5 text-sm text-stone-300">
              <p>Per-photo price: {money(gallery.default_price_cents)}</p>
              <p>Full gallery: {gallery.full_gallery_price_cents ? money(gallery.full_gallery_price_cents) : "Disabled"}</p>
              <p>Downloads per token: {gallery.download_limit}</p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-lg font-medium">Photos</h2>
              {photos.length === 0 ? (
                <div className="rounded-md border border-white/10 p-8 text-stone-400">No photos uploaded yet.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {photos.map((photo) => (
                    <figure key={photo.id} className="overflow-hidden rounded-md border border-white/10 bg-white/[0.03]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/blob/preview/${photo.id}`} alt={photo.filename} className="aspect-[4/3] w-full object-cover" />
                      <figcaption className="flex items-center justify-between gap-3 p-3 text-sm text-stone-300">
                        <span className="truncate">{photo.filename}</span>
                        <span>{money(photo.price_cents ?? gallery.default_price_cents)}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-lg font-medium">Recent orders</h2>
              <div className="overflow-hidden rounded-md border border-white/10">
                {orders.length === 0 ? (
                  <p className="p-5 text-stone-400">No orders yet.</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="grid gap-2 border-b border-white/10 p-4 text-sm last:border-b-0 sm:grid-cols-4">
                      <span>{order.customer_email}</span>
                      <span>{order.status}</span>
                      <span>{money(order.total_cents, order.currency)}</span>
                      <span>{order.paid_at ? new Date(order.paid_at).toLocaleString() : "Awaiting payment"}</span>
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
