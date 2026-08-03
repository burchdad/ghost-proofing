import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ee] px-5 py-10 text-stone-950">
      <form action={loginAction} className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Studio access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">Manage proof galleries, uploads, checkout, and downloads.</p>
        </div>
        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            The email or password was not recognized.
          </p>
        ) : null}
        <label className="block text-sm font-semibold text-stone-600">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-2 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-950 outline-none focus:border-stone-950"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-stone-600">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-2 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-950 outline-none focus:border-stone-950"
          />
        </label>
        <button className="mt-5 h-11 w-full rounded-lg bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800">
          Enter dashboard
        </button>
      </form>
    </main>
  );
}
