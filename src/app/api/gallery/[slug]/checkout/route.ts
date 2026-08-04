import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import { calculateOrder, getStripe } from "@/lib/checkout";
import type { Gallery } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = (await request.json()) as {
    email?: string;
    photoIds?: string[];
    fullGallery?: boolean;
  };
  const email = String(body.email ?? "").toLowerCase().trim();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  const { rows } = await sql<Gallery>(
    "select * from galleries where slug = $1 and status = 'published'",
    [slug],
  );
  const gallery = rows[0];
  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }
  const order = await calculateOrder({
    gallery,
    photoIds: body.photoIds ?? [],
    fullGallery: Boolean(body.fullGallery),
  });
  const env = getEnv();
  const inserted = await sql<{ id: string }>(
    `insert into orders (studio_id, gallery_id, customer_email, status, total_cents, currency, purchased_full_gallery)
     values ($1,$2,$3,'pending',$4,$5,$6) returning id`,
    [gallery.studio_id, gallery.id, email, order.total, env.STRIPE_PRICE_CURRENCY, order.purchasedFullGallery],
  );
  const orderId = inserted.rows[0].id;
  for (const photo of order.photos) {
    await sql(
      "insert into order_items (order_id, photo_id, unit_amount_cents) values ($1,$2,$3) on conflict do nothing",
      [orderId, photo.id, photo.price_cents ?? gallery.default_price_cents],
    );
  }

  const stripe = getStripe();
  const origin = request.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/gallery/${gallery.slug}`,
    metadata: {
      orderId,
      galleryId: gallery.id,
      photoIds: order.photos.map((photo) => photo.id).join(","),
      fullGallery: String(order.purchasedFullGallery),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: env.STRIPE_PRICE_CURRENCY,
          unit_amount: order.total,
          product_data: {
            name: order.purchasedFullGallery
              ? `${gallery.title} - full gallery`
              : `${gallery.title} - ${order.photos.length} photo download${order.photos.length === 1 ? "" : "s"}`,
          },
        },
      },
    ],
  });
  await sql("update orders set stripe_checkout_session_id = $1 where id = $2", [session.id, orderId]);
  return NextResponse.json({ url: session.url });
}
