import Link from "next/link";
import { Camera, Lock, ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-stone-600">
            <Camera className="h-5 w-5" />
            Ghost Proofing
          </div>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-950"
          >
            Studio sign in
          </Link>
        </nav>
        <div className="max-w-3xl py-20">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-amber-700">
            Private photography proofing
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
            Sell polished proof galleries without exposing originals.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Upload originals, generate real watermarked previews, collect payment
            through Stripe, and release short-lived original download links only
            after the webhook confirms the order.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 text-sm font-semibold text-stone-700">
            <span className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
              <Lock className="h-4 w-4 text-amber-700" /> Private originals
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
              <ShoppingBag className="h-4 w-4 text-amber-700" /> Server-priced checkout
            </span>
          </div>
        </div>
        <div className="grid gap-3 border-t border-stone-200 pt-6 text-sm text-stone-500 sm:grid-cols-3">
          <p>Railway Postgres for gallery, order, and token state.</p>
          <p>S3-compatible blob buckets for originals and previews.</p>
          <p>Sharp-generated watermark pixels, never CSS-only overlays.</p>
        </div>
      </section>
    </main>
  );
}
