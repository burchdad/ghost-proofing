import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-6 text-stone-100">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-amber-200/80">Payment received</p>
        <h1 className="mt-3 text-4xl font-semibold">Your downloads are being prepared.</h1>
        <p className="mt-4 text-stone-400">
          Once Stripe sends the verified webhook, Ghost Proofing emails the secure download link.
        </p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-md border border-white/15 px-4 text-sm hover:bg-white/10">
          Return home
        </Link>
      </div>
    </main>
  );
}
