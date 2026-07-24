"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Loader2, RotateCcw, Upload } from "lucide-react";

type UploadState = "idle" | "ready" | "uploading" | "done" | "error";

export function PhotoUploadForm({ slug }: { slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  function updateFiles(fileList: FileList | null) {
    const nextFiles = Array.from(fileList ?? []);
    setFiles(nextFiles);
    setProgress(0);
    setMessage("");
    setState(nextFiles.length > 0 ? "ready" : "idle");
  }

  function upload() {
    if (files.length === 0 || state === "uploading") return;
    setState("uploading");
    setProgress(2);
    setMessage("Uploading originals and generating previews...");

    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));
    const request = new XMLHttpRequest();
    request.open("POST", `/api/dashboard/galleries/${slug}/photos`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.max(2, Math.round((event.loaded / event.total) * 92)));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        setProgress(100);
        setState("done");
        setMessage(`${files.length} photo${files.length === 1 ? "" : "s"} added.`);
        window.setTimeout(() => window.location.reload(), 700);
        return;
      }
      try {
        const body = JSON.parse(request.responseText) as { error?: string };
        setMessage(body.error ?? "Upload failed.");
      } catch {
        setMessage("Upload failed.");
      }
      setState("error");
    };
    request.onerror = () => {
      setMessage("The connection dropped while uploading.");
      setState("error");
    };
    request.send(formData);
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <section className="rounded-md border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-amber-200 text-black">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Add photos</h2>
          <p className="mt-1 text-sm leading-6 text-stone-400">
            Pick images from your phone camera roll or capture new shots, then keep this screen open while previews are processed.
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-14 items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-medium hover:bg-white/10"
        >
          <ImagePlus className="h-5 w-5" />
          Choose from phone
        </button>
        <button
          type="button"
          onClick={upload}
          disabled={files.length === 0 || state === "uploading"}
          className="flex min-h-14 items-center justify-center gap-2 rounded-md bg-stone-100 px-4 text-sm font-medium text-black hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "uploading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          Upload and watermark
        </button>
      </div>

      {files.length > 0 ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-stone-200">{files.length} selected</span>
            <span className="font-mono text-stone-400">{(totalSize / 1024 / 1024).toFixed(1)} MB</span>
          </div>
          <div className="mt-3 max-h-28 space-y-2 overflow-auto pr-1">
            {files.slice(0, 8).map((file) => (
              <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 text-xs text-stone-400">
                <span className="truncate">{file.name}</span>
                <span className="font-mono">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            ))}
            {files.length > 8 ? <p className="text-xs text-stone-500">+ {files.length - 8} more</p> : null}
          </div>
        </div>
      ) : null}

      {state === "uploading" || state === "done" || state === "error" ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-stone-400">
            {state === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : null}
            {state === "error" ? <RotateCcw className="h-4 w-4 text-red-300" /> : null}
            {message}
          </p>
        </div>
      ) : null}
    </section>
  );
}
