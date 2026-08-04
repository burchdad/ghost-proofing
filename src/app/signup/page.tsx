import Link from "next/link";
import { Camera, CheckCircle2 } from "lucide-react";
import { signupAction } from "@/app/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-8 text-stone-950">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-stone-600">
            <Camera className="h-5 w-5" />
            GhostPhotos
          </Link>
          <Link href="/login" className="text-sm font-semibold text-stone-600 hover:text-stone-950">
            Sign in
          </Link>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">Photographer onboarding</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight">Start a studio portal in one step.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Create your GhostPhotos login, claim your studio subdomain, and land in settings to finish branding, policies, pricing, and gallery defaults.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-stone-600">
              {["Isolated client galleries", "Watermarked bulk uploads", "Stripe checkout and protected downloads"].map((item) => (
                <p key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-700" />
                  {item}
                </p>
              ))}
            </div>
          </div>

          <form action={signupAction} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Create your account</h2>
            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error === "taken" ? "That email or subdomain is already in use." : "Check the required fields and use an 8+ character password."}
              </p>
            ) : null}
            <div className="mt-5 space-y-4">
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Studio name
                <input name="studioName" required placeholder="KB Photography" className="h-11 rounded-lg border border-stone-300 px-3 outline-none focus:border-stone-950" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                GhostPhotos subdomain
                <input name="subdomain" required placeholder="kbphotography" className="h-11 rounded-lg border border-stone-300 px-3 outline-none focus:border-stone-950" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Your name
                <input name="photographerName" required placeholder="Kaisyn Burch" className="h-11 rounded-lg border border-stone-300 px-3 outline-none focus:border-stone-950" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Email
                <input name="email" required type="email" placeholder="you@example.com" className="h-11 rounded-lg border border-stone-300 px-3 outline-none focus:border-stone-950" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Password
                <input name="password" required minLength={8} type="password" className="h-11 rounded-lg border border-stone-300 px-3 outline-none focus:border-stone-950" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-600">
                Brand color
                <input name="brandColor" type="color" defaultValue="#f7c948" className="h-11 rounded-lg border border-stone-300 bg-white px-2 py-1" />
              </label>
            </div>
            <button className="mt-5 h-11 w-full rounded-lg bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800">
              Create studio
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
