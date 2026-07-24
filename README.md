# Ghost Proofing

Ghost Proofing is a private photography proofing MVP. Photographers upload originals, the server generates Sharp watermarked previews, customers purchase selected photos or a full gallery through Stripe Checkout, and paid customers receive tokenized access to originals.

## Architecture

- Next.js App Router, TypeScript, Tailwind CSS
- Railway Postgres via `DATABASE_URL`
- S3-compatible blob storage for originals and previews
- Stripe Checkout plus verified Stripe webhooks
- Sharp preview generation with real pixel watermarks
- Resend transactional email for download links

The original prompt named Supabase Postgres and Supabase Storage. This repo is configured for Railway Postgres and generic S3-compatible blob storage instead. Originals should stay in a private bucket. Previews can be public or private, but this implementation streams previews through `/api/blob/preview/[photoId]`.

The scaffold uses the current patched Next.js release instead of pinning to the requested Next 15 line because NPM marks that line as deprecated for a security issue.

## Setup

1. Create a Railway Postgres service and copy its connection string into `DATABASE_URL`.
2. Create two S3-compatible buckets:
   - `ghost-proofing-originals`
   - `ghost-proofing-previews`
3. Copy `.env.example` to `.env.local` and fill in every secret.
4. Run the migration:

```bash
psql "$DATABASE_URL" -f migrations/001_initial.sql
```

5. Optional seed:

```bash
psql "$DATABASE_URL" -f db/seed.sql
```

6. Start development:

```bash
npm install
npm run dev
```

## Stripe

Create a webhook endpoint pointed at:

```text
https://your-domain.com/api/stripe/webhook
```

Subscribe to:

```text
checkout.session.completed
```

Set the resulting secret as `STRIPE_WEBHOOK_SECRET`. The webhook verifies Stripe signatures before marking an order paid, creating a download token, and sending the customer email.

## Security Notes

- Originals are never rendered in a page or exposed as public URLs.
- Individual original download clicks redirect to a 15-minute signed object URL only after checking the token, order status, token expiry, download limit, and purchased photo.
- ZIP downloads stream originals server-side after the same token and paid-order checks.
- Browser price values are ignored. The checkout route recalculates all totals from Postgres.
- File type and size validation runs before upload processing.
- Railway Postgres is accessed only from server code. Authorization is enforced in Server Components, Server Actions, and Route Handlers with ownership/order checks.

## Current MVP Scope

Implemented:

- Admin email/password login
- Gallery creation, publishing, archiving
- Multi-image upload form
- Sharp preview generation
- Private originals and separate preview keys
- Customer gallery, selection, full-gallery package
- Stripe Checkout session creation
- Verified Stripe webhook
- Paid order/token creation
- Tokenized download portal
- Individual original downloads and ZIP download
- Seed data, migration, environment template

Still natural next hardening:

- Replace the simple built-in admin auth with Auth.js, Clerk, or your preferred provider.
- Add resumable uploads and client-side progress bars for very large galleries.
- Add per-photo price editing UI.
- Add automated tests around checkout metadata, duplicate photo IDs, and download limits.
- Add a Railway MinIO template or managed object storage module to provision buckets automatically.
