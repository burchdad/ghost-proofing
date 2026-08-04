import { GalleryClient } from "@/app/gallery/[slug]/GalleryClient";
import { unlockGalleryAction } from "@/app/gallery/[slug]/actions";
import { hasGalleryAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Gallery, Photo, Studio } from "@/lib/types";

export const dynamic = "force-dynamic";
type PublicGallery = Gallery & { password_hash: string | null };

export default async function PublicGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { rows } = await sql<PublicGallery>(
    "select * from galleries where slug = $1 and status = 'published'",
    [slug],
  );
  const gallery = rows[0];
  if (!gallery) {
    return <main className="grid min-h-screen place-items-center bg-[#050505] p-8 text-stone-100">Gallery is unavailable.</main>;
  }
  if (gallery.password_hash && !(await hasGalleryAccess(gallery.id))) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-6 text-stone-100">
        <form action={unlockGalleryAction} className="w-full max-w-sm space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-amber-200/80">Private gallery</p>
            <h1 className="mt-3 text-3xl font-semibold">{gallery.title}</h1>
          </div>
          {error ? (
            <p className="rounded-md border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-100">
              That gallery password was not recognized.
            </p>
          ) : null}
          <input type="hidden" name="slug" value={gallery.slug} />
          <label className="block text-sm text-stone-300">
            Gallery password
            <input
              name="password"
              type="password"
              required
              className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-stone-50 outline-none focus:border-amber-200/70"
            />
          </label>
          <button className="h-11 w-full rounded-md bg-stone-100 text-sm font-medium text-black hover:bg-amber-100">
            Open gallery
          </button>
        </form>
      </main>
    );
  }
  const [photoResult, studioResult] = await Promise.all([
    sql<Photo>(
      "select * from photos where gallery_id = $1 and studio_id = $2 order by sort_order, created_at",
      [gallery.id, gallery.studio_id],
    ),
    sql<Studio>("select * from studios where id = $1", [gallery.studio_id]),
  ]);
  const photos = photoResult.rows;
  const studio = studioResult.rows[0];
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-stone-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-200/80">{studio?.public_name ?? "Private gallery"}</p>
          <h1 className="mt-3 text-4xl font-semibold">{gallery.title}</h1>
          <p className="mt-2 text-stone-400">{gallery.customer_name}</p>
          {studio?.terms_url ? (
            <a href={studio.terms_url} className="mt-3 inline-flex text-sm font-semibold text-amber-100 hover:text-white">
              Terms and policies
            </a>
          ) : null}
        </header>
        {photos.length === 0 ? (
          <div className="rounded-md border border-white/10 p-8 text-stone-400">No proofs are available yet.</div>
        ) : (
          <GalleryClient gallery={gallery} photos={photos} paymentNote={studio?.stripe_payment_note} refundPolicy={studio?.refund_policy} />
        )}
      </div>
    </main>
  );
}
