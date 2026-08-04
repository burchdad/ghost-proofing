import Link from "next/link";
import { ArrowRight, Camera, Images, Lock, Mail } from "lucide-react";
import type { Studio } from "@/lib/types";
import type { PublicGalleryRow } from "@/lib/public-studios";

export function StudioNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ee] p-8 text-stone-950">
      <div className="max-w-md text-center">
        <Camera className="mx-auto h-9 w-9 text-stone-400" />
        <h1 className="mt-4 text-3xl font-semibold">Studio not found</h1>
        <p className="mt-2 text-stone-500">Check the link with your photographer.</p>
      </div>
    </main>
  );
}

export function StudioPortalView({
  studio,
  galleries,
}: {
  studio: Studio;
  galleries: PublicGalleryRow[];
}) {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="border-b border-stone-200 pb-8">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-stone-500">
            {studio.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={studio.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: studio.brand_color }} />
            )}
            Client proofing portal
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-5xl font-semibold tracking-tight">{studio.public_name ?? studio.name}</h1>
              <p className="mt-3 max-w-2xl text-stone-600">
                {studio.client_intro}
              </p>
            </div>
            {studio.contact_email ? (
              <a
                href={`mailto:${studio.contact_email}`}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-950"
              >
                <Mail className="h-4 w-4" />
                Contact
              </a>
            ) : null}
          </div>
        </header>

        {galleries.length === 0 ? (
          <section className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
            <Images className="mx-auto h-10 w-10 text-stone-400" />
            <h2 className="mt-4 text-xl font-semibold">No published galleries yet</h2>
            <p className="mt-2 text-sm text-stone-500">Your photographer will share a gallery link when proofs are ready.</p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery) => (
              <Link
                key={gallery.id}
                href={`/gallery/${gallery.slug}`}
                className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm hover:border-stone-950"
              >
                <div className="aspect-[4/3] bg-stone-100">
                  {gallery.preview_photo_id ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/blob/preview/${gallery.preview_photo_id}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-stone-400">
                      <Images className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">{gallery.title}</h2>
                      <p className="mt-1 text-sm text-stone-500">{gallery.customer_name}</p>
                    </div>
                    {gallery.has_password ? (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600">
                        <Lock className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-500">{gallery.photo_count} proofs</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-stone-950">
                      Open <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
