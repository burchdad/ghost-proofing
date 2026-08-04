import "server-only";

import { Resend } from "resend";
import { getEnv } from "@/lib/env";
import { galleryPublicUrl } from "@/lib/public-studios";
import type { Gallery, Studio } from "@/lib/types";

function resendClient() {
  const env = getEnv();
  if (!env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(env.RESEND_API_KEY);
}

export async function sendGalleryPublishedEmail({
  gallery,
  studio,
}: {
  gallery: Gallery;
  studio: Studio;
}) {
  if (!studio.gallery_published_email_enabled) {
    return;
  }
  const resend = resendClient();
  if (!resend) {
    return;
  }

  const url = galleryPublicUrl(studio, gallery.slug);
  await resend.emails.send({
    from: getEnv().EMAIL_FROM,
    to: gallery.customer_email,
    subject: `${studio.public_name} shared ${gallery.title}`,
    text: [
      `Hi ${gallery.customer_name},`,
      "",
      `${studio.public_name} has published your proof gallery.`,
      url,
      "",
      studio.stripe_payment_note,
      studio.refund_policy ? `Refund policy: ${studio.refund_policy}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
