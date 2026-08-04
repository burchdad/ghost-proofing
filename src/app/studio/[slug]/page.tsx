import Link from "next/link";
import { ArrowRight, Camera, Images, Lock } from "lucide-react";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type StudioRow = {
  id: string;
  name: string;
  contact_email: string | null;
};

type PublicGalleryRow = {
  id: string;
  slug: string;
  title: string;
  customer_name: string;
  expires_at: string | null;
  photo_count: string;
  preview_photo_id: string | null;
  has_password: boolean;
};

export default async function StudioClientPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows: studioRows } = await sql<StudioRow>(
    "select id, name, contact_email from studios where slug = $1",
    [slug],
  );
  const studio = studioRows[0];

  if (!studio) {
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

  const { rows: galleries } = await sql<PublicGalleryRow>(
    `select
      g.id,
      g.slug,
      g.title,
      g.customer_name,
      g.expires_at,
      count(p.id)::text as photo_count,
      (
        select first_photo.id
        from photos first_photo
        where first_photo.gallery_id = g.id and first_photo.studio_id = g.studio_id
        order by first_photo.sort_order, first_photo.created_at
        limit 1
      ) as preview_photo_id,
      (g.password_hash is not null) as has_password
     from galleries g
     left join photos p on p.gallery_id = g.id and p.studio_id = g.studio_id
     where g.studio_id = $1 and g.status = 'published'
     group by g.id
     order by g.created_at desc`,
    [studio.id],
  );

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="border-b border-stone-200 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Client proofing portal</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-5xl font-semibold tracking-tight">{studio.name}</h1>
              <p className="mt-3 max-w-2xl text-stone-600">
                Choose your private proof gallery below. Each gallery is managed separately by this studio.
              </p>
            </div>
            {studio.contact_email ? (
              <a
                href={`mailto:${studio.contact_email}`}
                className="inline-flex h-11 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-950"
              >
                Contact studio
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
