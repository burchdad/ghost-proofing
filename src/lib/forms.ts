import { safeSlug } from "@/lib/format";

export function cents(value: FormDataEntryValue | null, fallback: number) {
  const amount = Number(value || fallback);
  return Math.max(0, Math.round(amount * 100));
}

export function normalizeCustomDomain(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) {
    return null;
  }
  return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

export function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function normalizeSubdomain(value: FormDataEntryValue | null, fallback: string) {
  return safeSlug(String(value || fallback)).slice(0, 63);
}

export function normalizeColor(value: FormDataEntryValue | null) {
  const raw = String(value || "#f7c948").trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : "#f7c948";
}
