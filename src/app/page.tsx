import Link from "next/link";
import { Camera, Globe2, Images, Lock, ShoppingBag, UploadCloud } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-stone-600">
            <Camera className="h-5 w-5" />
            GhostPhotos
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/studios"
              className="hidden h-11 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-950 sm:inline-flex"
            >
              Client portals
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Photographer login
            </Link>
          </div>
        </nav>
        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div>
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-amber-700">
            Photography proofing platform
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
            GhostPhotos
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            A proofing home for photographers who need client-specific galleries,
            real watermarked previews, Stripe checkout, and private delivery links
            in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-lg bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Set up a studio
            </Link>
            <Link
              href="/studios"
              className="inline-flex h-12 items-center rounded-lg border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 hover:border-stone-950"
            >
              View client portals
            </Link>
          </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-stone-950 p-4 text-white">
                <UploadCloud className="h-5 w-5 text-amber-200" />
                <p className="mt-4 text-2xl font-semibold">Bulk upload</p>
                <p className="mt-1 text-sm text-stone-300">Batch originals into protected proof galleries.</p>
              </div>
              <div className="rounded-lg bg-stone-100 p-4">
                <Globe2 className="h-5 w-5 text-stone-700" />
                <p className="mt-4 text-2xl font-semibold">Studio links</p>
                <p className="mt-1 text-sm text-stone-500">Use subdomains now, custom domains when ready.</p>
              </div>
              <div className="rounded-lg bg-stone-100 p-4">
                <Images className="h-5 w-5 text-stone-700" />
                <p className="mt-4 text-2xl font-semibold">Client proofing</p>
                <p className="mt-1 text-sm text-stone-500">Each photographer’s galleries stay separated.</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-4">
                <ShoppingBag className="h-5 w-5 text-amber-800" />
                <p className="mt-4 text-2xl font-semibold">Paid delivery</p>
                <p className="mt-1 text-sm text-amber-900">Orders release originals after payment clears.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 border-t border-stone-200 pt-6 text-sm text-stone-500 sm:grid-cols-3">
          <p className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-700" /> Private originals
          </p>
          <p>Tenant-aware galleries for multi-photographer use.</p>
          <p className="inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-700" /> Server-priced checkout
          </p>
        </div>
      </section>
    </main>
  );
}
