import Link from "next/link";
import { ArrowLeft, Building2, KeyRound, Mail, Plus, UserRound } from "lucide-react";
import { createStudioMemberAction } from "@/app/dashboard/studios/actions";
import { requirePlatformAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { sql } from "@/lib/db";
import type { Profile, Studio } from "@/lib/types";

export const dynamic = "force-dynamic";

type StudioRow = Studio & {
  member_count: string;
  gallery_count: string;
  paid_order_count: string;
};

function fieldClassName() {
  return "h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-stone-950";
}

export default async function StudiosPage() {
  await requirePlatformAdmin();
  const [studioResult, memberResult] = await Promise.all([
    sql<StudioRow>(
      `select s.*,
        count(distinct p.id)::text as member_count,
        count(distinct g.id)::text as gallery_count,
        count(distinct o.id) filter (where o.status = 'paid')::text as paid_order_count
       from studios s
       left join profiles p on p.studio_id = s.id
       left join galleries g on g.studio_id = s.id
       left join orders o on o.studio_id = s.id
       group by s.id
       order by s.created_at desc`,
    ),
    sql<Profile>(
      `select p.id, p.email, p.display_name, p.role, p.branding_name, p.studio_id, s.name as studio_name
       from profiles p
       left join studios s on s.id = p.studio_id
       order by s.name, p.created_at desc`,
    ),
  ]);

  const studios = studioResult.rows;
  const members = memberResult.rows;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="border-b border-stone-200 pb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Platform admin</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Studios & photographers</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Create isolated photographer workspaces. Each studio gets its own galleries, uploads, orders, and defaults.
            </p>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[420px_1fr]">
          <form action={createStudioMemberAction} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-stone-950 text-amber-200">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Add photographer</h2>
                <p className="text-sm text-stone-500">Create a studio and first login in one step.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Studio name
                <input name="studioName" required placeholder="Example Photography" className={fieldClassName()} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Optional studio URL slug
                <input name="studioSlug" placeholder="example-photography" className={fieldClassName()} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Photographer name
                <input name="photographerName" required placeholder="Avery Stone" className={fieldClassName()} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Email
                <input name="email" required type="email" placeholder="photographer@example.com" className={fieldClassName()} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Temporary password
                <input name="password" required type="password" minLength={8} placeholder="At least 8 characters" className={fieldClassName()} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Default per photo
                  <input name="defaultPrice" type="number" min="0" step="0.01" defaultValue="25" className={fieldClassName()} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-600">
                  Full gallery
                  <input name="fullGalleryPrice" type="number" min="0" step="0.01" placeholder="225" className={fieldClassName()} />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Watermark text
                <input name="watermarkText" placeholder="PROOF - PURCHASE TO DOWNLOAD" className={fieldClassName()} />
              </label>
            </div>

            <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800">
              <KeyRound className="h-4 w-4 text-amber-200" />
              Create login
            </button>
          </form>

          <div className="space-y-6">
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-stone-500" />
                <h2 className="text-xl font-semibold">Studios</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {studios.map((studio) => (
                  <article key={studio.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{studio.name}</h3>
                        <p className="mt-1 text-sm text-stone-500">{studio.slug}</p>
                        {studio.contact_email ? (
                          <p className="mt-2 inline-flex items-center gap-2 text-sm text-stone-600">
                            <Mail className="h-4 w-4" />
                            {studio.contact_email}
                          </p>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-stone-200">
                          <b className="block text-stone-950">{studio.member_count}</b>
                          members
                        </span>
                        <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-stone-200">
                          <b className="block text-stone-950">{studio.gallery_count}</b>
                          galleries
                        </span>
                        <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-stone-200">
                          <b className="block text-stone-950">{studio.paid_order_count}</b>
                          paid
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-stone-500">
                      Defaults: {money(studio.default_price_cents)} per photo
                      {studio.default_full_gallery_price_cents
                        ? ` / ${money(studio.default_full_gallery_price_cents)} full gallery`
                        : " / full gallery disabled"}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-stone-500" />
                <h2 className="text-xl font-semibold">Photographer logins</h2>
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
                {members.map((member) => (
                  <div key={member.id} className="grid gap-2 border-b border-stone-200 p-4 text-sm last:border-b-0 sm:grid-cols-[1fr_1fr_auto]">
                    <span className="font-medium text-stone-950">{member.display_name}</span>
                    <span className="text-stone-600">{member.email}</span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-600">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
