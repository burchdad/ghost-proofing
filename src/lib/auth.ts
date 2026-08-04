import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/env";
import { sql } from "@/lib/db";
import type { Profile } from "@/lib/types";

export async function hashSecret(secret: string) {
  return bcrypt.hash(secret, 12);
}

export async function verifySecret(secret: string, hash: string | null | undefined) {
  if (!hash) return false;
  return bcrypt.compare(secret, hash);
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export async function signSession(profileId: string) {
  const env = getEnv();
  const secret = env.AUTH_SECRET ?? "development-secret-change-this-value-please";
  const payload = `${profileId}.${Date.now()}`;
  const sig = createHash("sha256").update(`${payload}.${secret}`).digest("base64url");
  return `${payload}.${sig}`;
}

function signValue(value: string) {
  const env = getEnv();
  const secret = env.AUTH_SECRET ?? "development-secret-change-this-value-please";
  return createHash("sha256").update(`${value}.${secret}`).digest("base64url");
}

export function galleryAccessCookieName(galleryId: string) {
  return `gallery_access_${galleryId}`;
}

export function signGalleryAccess(galleryId: string) {
  return signValue(`gallery.${galleryId}`);
}

export async function hasGalleryAccess(galleryId: string) {
  const jar = await cookies();
  return jar.get(galleryAccessCookieName(galleryId))?.value === signGalleryAccess(galleryId);
}

export async function readSession() {
  const env = getEnv();
  const jar = await cookies();
  const value = jar.get(env.AUTH_COOKIE_NAME)?.value;
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [profileId, issuedAt, sig] = parts;
  const secret = env.AUTH_SECRET ?? "development-secret-change-this-value-please";
  const expected = createHash("sha256").update(`${profileId}.${issuedAt}.${secret}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return profileId;
}

export async function getCurrentProfile() {
  const profileId = await readSession();
  if (!profileId) return null;
  const { rows } = await sql<Profile>(
    `select p.id, p.email, p.display_name, p.role, p.branding_name, p.studio_id, s.name as studio_name
     from profiles p
     left join studios s on s.id = p.studio_id
     where p.id = $1`,
    [profileId],
  );
  return rows[0] ?? null;
}

export function isPlatformAdmin(profile: Profile) {
  return profile.role === "platform_admin";
}

export function canManageStudio(profile: Profile) {
  return ["platform_admin", "photographer", "assistant", "admin"].includes(profile.role);
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStudio(profile)) {
    redirect("/login");
  }
  return profile;
}

export async function requirePlatformAdmin() {
  const profile = await requireAdmin();
  if (!isPlatformAdmin(profile)) {
    redirect("/dashboard");
  }
  return profile;
}
