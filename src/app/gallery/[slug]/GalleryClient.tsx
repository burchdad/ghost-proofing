"use client";

import { useMemo, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { money } from "@/lib/format";
import type { Gallery, Photo } from "@/lib/types";

export function GalleryClient({
  gallery,
  photos,
  paymentNote,
  refundPolicy,
}: {
  gallery: Gallery;
  photos: Photo[];
  paymentNote?: string;
  refundPolicy?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState(gallery.customer_email);
  const [fullGallery, setFullGallery] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedTotal = useMemo(() => {
    if (fullGallery && gallery.full_gallery_price_cents) return gallery.full_gallery_price_cents;
    return photos
      .filter((photo) => selected.includes(photo.id))
      .reduce((sum, photo) => sum + (photo.price_cents ?? gallery.default_price_cents), 0);
  }, [fullGallery, gallery.default_price_cents, gallery.full_gallery_price_cents, photos, selected]);

  async function checkout() {
    setLoading(true);
    const response = await fetch(`/api/gallery/${gallery.slug}/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, photoIds: selected, fullGallery }),
    });
    const body = (await response.json()) as { url?: string; error?: string };
    setLoading(false);
    if (body.url) window.location.href = body.url;
    else alert(body.error ?? "Checkout could not be started.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo) => {
          const checked = selected.includes(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected((value) => checked ? value.filter((id) => id !== photo.id) : [...value, photo.id])}
              onContextMenu={(event) => event.preventDefault()}
              className={`overflow-hidden rounded-md border text-left ${checked ? "border-amber-200" : "border-white/10 hover:border-white/30"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/blob/preview/${photo.id}`}
                alt={photo.filename}
                draggable={false}
                className="aspect-[4/3] w-full select-none object-cover"
              />
              <span className="flex items-center justify-between gap-2 bg-black p-3 text-sm">
                <span className="truncate text-stone-300">{photo.filename}</span>
                <span className="text-stone-100">{money(photo.price_cents ?? gallery.default_price_cents)}</span>
              </span>
            </button>
          );
        })}
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-md border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Purchase</h2>
            <ShoppingBag className="h-5 w-5 text-amber-200" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setSelected(photos.map((photo) => photo.id))} className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10">
              Select all
            </button>
            <button onClick={() => { setSelected([]); setFullGallery(false); }} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10">
              <X className="h-4 w-4" /> Clear
            </button>
          </div>
          {gallery.full_gallery_price_cents ? (
            <label className="mt-5 flex items-center gap-3 rounded-md border border-white/10 p-3 text-sm">
              <input type="checkbox" checked={fullGallery} onChange={(event) => setFullGallery(event.target.checked)} />
              Buy full gallery for {money(gallery.full_gallery_price_cents)}
            </label>
          ) : null}
          <label className="mt-5 block text-sm text-stone-300">
            Email for receipt and downloads
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3" />
          </label>
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-sm text-stone-400">{fullGallery ? "Full gallery" : `${selected.length} selected`}</p>
            <p className="mt-1 text-3xl font-semibold">{money(selectedTotal)}</p>
          </div>
          <button
            onClick={checkout}
            disabled={loading || selectedTotal <= 0 || !email}
            className="mt-5 h-11 w-full rounded-md bg-stone-100 font-medium text-black hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Starting checkout..." : "Checkout"}
          </button>
          <p className="mt-4 text-xs leading-5 text-stone-500">
            {paymentNote ?? "Payments are processed securely through Stripe."}
          </p>
          {refundPolicy ? (
            <p className="mt-3 text-xs leading-5 text-stone-500">{refundPolicy}</p>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-stone-500">
            Original access is protected by private storage, verified payment, and expiring signed links.
          </p>
        </div>
      </aside>
    </div>
  );
}
