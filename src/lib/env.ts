import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_COOKIE_NAME: z.string().default("ghost_proofing_session"),
  AUTH_SECRET: z.string().min(32).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  BLOB_ENDPOINT: z.string().url().optional(),
  BLOB_REGION: z.string().default("auto"),
  BLOB_ACCESS_KEY_ID: z.string().optional(),
  BLOB_SECRET_ACCESS_KEY: z.string().optional(),
  BLOB_FORCE_PATH_STYLE: z.string().default("true"),
  BLOB_ORIGINALS_BUCKET: z.string().default("ghost-proofing-originals"),
  BLOB_PREVIEWS_BUCKET: z.string().default("ghost-proofing-previews"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_CURRENCY: z.string().default("usd"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Ghost Proofing <receipts@example.com>"),
});

export function getEnv() {
  return envSchema.parse(process.env);
}

export function requireEnv(name: keyof z.infer<typeof envSchema>) {
  const value = getEnv()[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value);
}
