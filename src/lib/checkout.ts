import "server-only";

import Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import type { Gallery, Photo } from "@/lib/types";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!stripe) {
    const key = getEnv().STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    stripe = new Stripe(key);
  }
  return stripe;
}

export type CalculatedOrder = {
  photos: Photo[];
  total: number;
  purchasedFullGallery: boolean;
};

export async function calculateOrder({
  gallery,
  photoIds,
  fullGallery,
}: {
  gallery: Gallery;
  photoIds: string[];
  fullGallery: boolean;
}): Promise<CalculatedOrder> {
  const distinctIds = Array.from(new Set(photoIds));
  const photoResult = await sql<Photo>(
    "select * from photos where gallery_id = $1 and studio_id = $2 order by sort_order, created_at",
    [gallery.id, gallery.studio_id],
  );
  const allPhotos: Photo[] = photoResult.rows;
  if (fullGallery) {
    if (!gallery.full_gallery_price_cents) {
      throw new Error("Full-gallery purchase is not enabled.");
    }
    return {
      photos: allPhotos,
      total: gallery.full_gallery_price_cents,
      purchasedFullGallery: true,
    };
  }
  if (distinctIds.length === 0) throw new Error("Select at least one photo.");
  const selected = allPhotos.filter((photo) => distinctIds.includes(photo.id));
  if (selected.length !== distinctIds.length) {
    throw new Error("One or more selected photos are invalid.");
  }
  const total = selected.reduce(
    (sum, photo) => sum + (photo.price_cents ?? gallery.default_price_cents),
    0,
  );
  return { photos: selected, total, purchasedFullGallery: false };
}
