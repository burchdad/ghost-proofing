import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createOpaqueToken, tokenHash } from "@/lib/auth";
import { getStripe } from "@/lib/checkout";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const token = createOpaqueToken();
      await sql(
        `update orders
         set status = 'paid', paid_at = now(), stripe_payment_intent_id = $1
         where id = $2`,
        [String(session.payment_intent ?? ""), orderId],
      );
      const { rows } = await sql<{ customer_email: string; download_limit: number; title: string }>(
        `select o.customer_email, g.download_limit, g.title
         from orders o join galleries g on g.id = o.gallery_id
         where o.id = $1`,
        [orderId],
      );
      const record = rows[0];
      await sql(
        `insert into download_tokens (order_id, token_hash, expires_at, max_downloads)
         values ($1,$2, now() + interval '30 days', $3)`,
        [orderId, tokenHash(token), record?.download_limit ?? 5],
      );
      if (env.RESEND_API_KEY && record) {
        const resend = new Resend(env.RESEND_API_KEY);
        await resend.emails.send({
          from: env.EMAIL_FROM,
          to: record.customer_email,
          subject: `Your ${record.title} downloads are ready`,
          text: `Your secure download page is ready: ${env.APP_URL}/downloads/${token}`,
        });
      }
    }
  }
  return NextResponse.json({ received: true });
}
