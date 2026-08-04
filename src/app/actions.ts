"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/env";
import { hashSecret, signSession, verifySecret } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Profile } from "@/lib/types";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const env = getEnv();

  const { rows } = await sql<Profile & { password_hash: string | null }>(
    "select id, email, display_name, role, branding_name, password_hash from profiles where email = $1",
    [email],
  );

  let profile = rows[0];
  if (!profile && env.ADMIN_EMAIL && env.ADMIN_PASSWORD && email === env.ADMIN_EMAIL) {
    const passwordHash = await hashSecret(env.ADMIN_PASSWORD);
    const studio = await sql<{ id: string }>(
      `insert into studios (name, public_name, slug, subdomain, contact_email, default_branding_name)
       values ($1, $1, 'main-studio', 'main-studio', $2, $1)
       on conflict (slug) do update set contact_email = excluded.contact_email
       returning id`,
      ["GhostPhotos", env.ADMIN_EMAIL],
    );
    const created = await sql<Profile & { password_hash: string | null }>(
      `insert into profiles (email, display_name, role, password_hash, studio_id)
       values ($1, $2, 'platform_admin', $3, $4)
       returning id, email, display_name, role, branding_name, password_hash`,
      [env.ADMIN_EMAIL, "Studio Admin", passwordHash, studio.rows[0].id],
    );
    profile = created.rows[0];
  }

  const isSeedPassword =
    profile &&
    !profile.password_hash &&
    env.ADMIN_EMAIL === email &&
    env.ADMIN_PASSWORD === password;
  const isStoredPassword = profile ? await verifySecret(password, profile.password_hash) : false;

  if (!profile || (!isSeedPassword && !isStoredPassword)) {
    redirect("/login?error=invalid");
  }

  if (isSeedPassword) {
    await sql("update profiles set password_hash = $1 where id = $2", [
      await bcrypt.hash(password, 12),
      profile.id,
    ]);
  }

  const jar = await cookies();
  jar.set(env.AUTH_COOKIE_NAME, await signSession(profile.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  const env = getEnv();
  const jar = await cookies();
  jar.delete(env.AUTH_COOKIE_NAME);
  redirect("/login");
}
