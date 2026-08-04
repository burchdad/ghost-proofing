import Link from "next/link";
import { ArrowRight, Camera, Images } from "lucide-react";
import { getPublicStudioSummaries, platformBaseUrl, tenantBaseUrl } from "@/lib/public-studios";

export const dynamic = "force-dynamic";

export default async function PublicStudiosPage() {
  const studios = await getPublicStudioSummaries();
  const appUrl = platformBaseUrl();

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <Link href="/" className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-stone-600">
            <Camera className="h-5 w-5" />
            GhostPhotos
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Photographer login
          </Link>
        </header>

        <section className="py-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">Client portals</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">Find your photographer’s gallery home.</h1>
          <p className="mt-4 max-w-2xl text-stone-600">
            Each studio has its own public portal, so clients only see galleries published by their photographer.
          </p>
        </section>

        {studios.length === 0 ? (
          <section className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
            <Images className="mx-auto h-10 w-10 text-stone-400" />
            <h2 className="mt-4 text-xl font-semibold">No public studios yet</h2>
            <p className="mt-2 text-sm text-stone-500">Published galleries will appear here once photographers are ready.</p>
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {studios.map((studio) => (
              <Link
                key={studio.id}
                href={tenantBaseUrl(studio)}
                className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm hover:border-stone-950"
              >
                <div className="aspect-[4/3] bg-stone-100">
                  {studio.preview_photo_id ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${appUrl}/api/blob/preview/${studio.preview_photo_id}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-stone-400">
                      <Images className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-semibold tracking-tight">{studio.public_name}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {studio.published_gallery_count} published {Number(studio.published_gallery_count) === 1 ? "gallery" : "galleries"}
                  </p>
                  {studio.latest_gallery_title ? (
                    <p className="mt-4 text-sm text-stone-600">Latest: {studio.latest_gallery_title}</p>
                  ) : null}
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-stone-950">
                    Open portal <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
