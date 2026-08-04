"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Loader2, RotateCcw, Upload, X } from "lucide-react";

type UploadState = "idle" | "ready" | "uploading" | "done" | "error";

const BATCH_SIZE = 20;

function uniqueFiles(files: File[]) {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function PhotoUploadForm({ slug }: { slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [activeBatch, setActiveBatch] = useState(0);
  const [processed, setProcessed] = useState(0);

  function updateFiles(fileList: FileList | File[] | null, append = false) {
    const incoming = Array.from(fileList ?? []);
    const nextFiles = uniqueFiles(append ? [...files, ...incoming] : incoming);
    setFiles(nextFiles);
    setProgress(0);
    setProcessed(0);
    setActiveBatch(0);
    setMessage("");
    setState(nextFiles.length > 0 ? "ready" : "idle");
  }

  function clearFiles() {
    setFiles([]);
    setProgress(0);
    setProcessed(0);
    setActiveBatch(0);
    setMessage("");
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadBatch(batch: File[], batchIndex: number, batchCount: number) {
    return new Promise<number>((resolve, reject) => {
      const formData = new FormData();
      batch.forEach((file) => formData.append("photos", file));
      const request = new XMLHttpRequest();
      request.open("POST", `/api/dashboard/galleries/${slug}/photos`);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const batchProgress = event.loaded / event.total;
          const completedBatches = batchIndex / batchCount;
          setProgress(Math.round((completedBatches + batchProgress / batchCount) * 92));
        }
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          try {
            const body = JSON.parse(request.responseText) as { processed?: number };
            resolve(body.processed ?? batch.length);
          } catch {
            resolve(batch.length);
          }
          return;
        }
        try {
          const body = JSON.parse(request.responseText) as { error?: string };
          reject(new Error(body.error ?? "Upload failed."));
        } catch {
          reject(new Error("Upload failed."));
        }
      };
      request.onerror = () => reject(new Error("The connection dropped while uploading."));
      request.send(formData);
    });
  }

  async function upload() {
    if (files.length === 0 || state === "uploading") return;
    setState("uploading");
    setProgress(1);
    setProcessed(0);

    const batches: File[][] = [];
    for (let index = 0; index < files.length; index += BATCH_SIZE) {
      batches.push(files.slice(index, index + BATCH_SIZE));
    }

    try {
      let totalProcessed = 0;
      for (let index = 0; index < batches.length; index += 1) {
        setActiveBatch(index + 1);
        setMessage(`Uploading batch ${index + 1} of ${batches.length}...`);
        const count = await uploadBatch(batches[index], index, batches.length);
        totalProcessed += count;
        setProcessed(totalProcessed);
      }
      setProgress(100);
      setState("done");
      setMessage(`${totalProcessed} photo${totalProcessed === 1 ? "" : "s"} added. Refreshing gallery...`);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const batchCount = Math.max(1, Math.ceil(files.length / BATCH_SIZE));

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-stone-950 text-amber-200">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Bulk import photos</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Drag in a full gallery or choose files. GhostPhotos uploads in {BATCH_SIZE}-photo batches and watermarks each preview.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        name="photos"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        onChange={(event) => updateFiles(event.target.files)}
        className="sr-only"
      />

      <div
        className="mt-5 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          updateFiles(event.dataTransfer.files, true);
        }}
      >
        <ImagePlus className="mx-auto h-8 w-8 text-stone-400" />
        <p className="mt-3 text-sm font-semibold text-stone-700">Drop photos here for bulk import</p>
        <p className="mt-1 text-xs text-stone-500">JPG, PNG, WebP, HEIC, or HEIF</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-950"
        >
          <ImagePlus className="h-4 w-4" />
          Choose files
        </button>
      </div>

      {files.length > 0 ? (
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-stone-700">
              {files.length} selected / {batchCount} batch{batchCount === 1 ? "" : "es"}
            </span>
            <span className="font-mono text-stone-500">{(totalSize / 1024 / 1024).toFixed(1)} MB</span>
          </div>
          <div className="mt-3 max-h-32 space-y-2 overflow-auto pr-1">
            {files.slice(0, 12).map((file) => (
              <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 text-xs text-stone-500">
                <span className="truncate">{file.name}</span>
                <span className="font-mono">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            ))}
            {files.length > 12 ? <p className="text-xs text-stone-500">+ {files.length - 12} more</p> : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={upload}
          disabled={files.length === 0 || state === "uploading"}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "uploading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          {state === "uploading" ? `Processing ${processed}/${files.length}` : "Upload and watermark"}
        </button>
        <button
          type="button"
          onClick={clearFiles}
          disabled={state === "uploading" || files.length === 0}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      </div>

      {state === "uploading" || state === "done" || state === "error" ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
            {state === "uploading" ? <Loader2 className="h-4 w-4 animate-spin text-amber-600" /> : null}
            {state === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
            {state === "error" ? <RotateCcw className="h-4 w-4 text-red-600" /> : null}
            {state === "uploading" ? `${message} Batch ${activeBatch}/${batchCount}.` : message}
          </p>
        </div>
      ) : null}
    </section>
  );
}
