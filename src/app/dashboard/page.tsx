import Link from "next/link";
import { Copy, Plus } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { createGalleryAction } from "@/app/dashboard/actions";
import { requireAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { money } from "@/lib/format";
import { sql } from "@/lib/db";
import type { Gallery } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAdmin();
  const env = getEnv();
  const galleryResult = await sql<Gallery>(
    `select g.*,
      count(distinct p.id)::text as photo_count,
      count(distinct o.id) filter (where o.status = 'paid')::text as paid_order_count
     from galleries g
     left join photos p on p.gallery_id = g.id
     left join orders o on o.gallery_id = g.id
     where g.owner_id = $1
     group by g.id
     order by g.created_at desc`,
    [profile.id],
  );
  const galleries: Gallery[] = galleryResult.rows;

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-stone-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-amber-200/80">{profile.branding_name}</p>
            <h1 className="mt-2 text-3xl font-semibold">Photographer dashboard</h1>
          </div>
          <form action={logoutAction}>
            <button className="rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/10">
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-8 py-8 lg:grid-cols-[390px_1fr]">
          <form action={createGalleryAction} className="space-y-4 rounded-md border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-200" />
              <h2 className="text-lg font-medium">Create gallery</h2>
            </div>
            <input name="title" required placeholder="Gallery title" className="h-11 w-full rounded-md border border-white/10 bg-black px-3" />
            <input name="slug" placeholder="Optional URL slug" className="h-11 w-full rounded-md border border-white/10 bg-black px-3" />
            <input name="customerName" required placeholder="Customer name" className="h-11 w-full rounded-md border border-white/10 bg-black px-3" />
            <input name="customerEmail" required type="email" placeholder="Customer email" className="h-11 w-full rounded-md border border-white/10 bg-black px-3" />
            <input name="expiresAt" type="date" className="h-11 w-full rounded-md border border-white/10 bg-black px-3" />
            <input name="password" type="password" placeholder="Optional gallery password" className="h-11 w-full rounded-md border border-white/10 bg-black px-3" />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-stone-300">Per photo
                <input name="defaultPrice" type="number" min="0" step="0.01" defaultValue="25" className="mt-1 h-11 w-full rounded-md border border-white/10 bg-black px-3" />
              </label>
              <label className="text-sm text-stone-300">Full gallery
                <input name="fullGalleryPrice" type="number" min="0" step="0.01" placeholder="225" className="mt-1 h-11 w-full rounded-md border border-white/10 bg-black px-3" />
              </label>
            </div>
            <input name="watermarkText" defaultValue="PROOF - PURCHASE TO DOWNLOAD" className="h-11 w-full rounded-md border border-white/10 bg-black px-3" />
            <div className="grid grid-cols-2 gap-3">
              <select name="watermarkLayout" defaultValue="tile" className="h-11 rounded-md border border-white/10 bg-black px-3">
                <option value="tile">Tiled diagonal</option>
                <option value="center">Large center</option>
              </select>
              <input name="watermarkOpacity" type="number" min="0.05" max="0.8" step="0.01" defaultValue="0.28" className="h-11 rounded-md border border-white/10 bg-black px-3" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input name="watermarkSize" type="number" defaultValue="180" className="h-11 rounded-md border border-white/10 bg-black px-3" />
              <input name="watermarkSpacing" type="number" defaultValue="320" className="h-11 rounded-md border border-white/10 bg-black px-3" />
              <input name="watermarkAngle" type="number" defaultValue="-32" className="h-11 rounded-md border border-white/10 bg-black px-3" />
            </div>
            <button className="h-11 w-full rounded-md bg-stone-100 font-medium text-black hover:bg-amber-100">
              Create gallery
            </button>
          </form>

          <div className="space-y-4">
            {galleries.length === 0 ? (
              <div className="rounded-md border border-white/10 p-8 text-stone-300">No galleries yet.</div>
            ) : (
              galleries.map((gallery) => (
                <Link
                  key={gallery.id}
                  href={`/dashboard/galleries/${gallery.slug}`}
                  className="grid gap-4 rounded-md border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-medium">{gallery.title}</h2>
                      <span className="rounded-sm bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-stone-300">
                        {gallery.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-400">{gallery.customer_name} / {gallery.customer_email}</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-stone-500">
                      <Copy className="h-4 w-4" /> {env.APP_URL}/gallery/{gallery.slug}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p>{gallery.photo_count ?? "0"} photos</p>
                    <p className="text-sm text-stone-400">{gallery.paid_order_count ?? "0"} paid orders</p>
                    <p className="text-sm text-stone-400">{money(gallery.default_price_cents)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
