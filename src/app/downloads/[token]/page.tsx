import { Download } from "lucide-react";
import { getDownloadPhotos, getDownloadRecord } from "@/lib/downloads";

export const dynamic = "force-dynamic";

export default async function DownloadsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await getDownloadRecord(token);
  if (!record) {
    return <main className="grid min-h-screen place-items-center bg-[#050505] p-8 text-stone-100">This download link is expired or unavailable.</main>;
  }
  const photos = await getDownloadPhotos(record.order_id);
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-stone-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-amber-200/80">Secure downloads</p>
            <h1 className="mt-3 text-4xl font-semibold">{record.gallery_title}</h1>
            <p className="mt-2 text-stone-400">
              Expires {new Date(record.expires_at).toLocaleString()} / {record.download_count} of {record.max_downloads} downloads used
            </p>
          </div>
          <a href={`/api/downloads/${token}/zip`} className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-100 px-4 font-medium text-black hover:bg-amber-100">
            <Download className="h-4 w-4" /> Download all
          </a>
        </header>
        <div className="space-y-3">
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
              <span className="text-stone-300">{photo.filename}</span>
              <a href={`/api/downloads/${token}/photos/${photo.id}`} className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10">
                Download original
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
