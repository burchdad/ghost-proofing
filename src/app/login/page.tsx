import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-6">
      <form action={loginAction} className="w-full max-w-sm space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-amber-200/80">Studio access</p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-50">Sign in</h1>
        </div>
        {error ? (
          <p className="rounded-md border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-100">
            The email or password was not recognized.
          </p>
        ) : null}
        <label className="block text-sm text-stone-300">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-stone-50 outline-none focus:border-amber-200/70"
          />
        </label>
        <label className="block text-sm text-stone-300">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-stone-50 outline-none focus:border-amber-200/70"
          />
        </label>
        <button className="h-11 w-full rounded-md bg-stone-100 text-sm font-medium text-black hover:bg-amber-100">
          Enter dashboard
        </button>
      </form>
    </main>
  );
}
