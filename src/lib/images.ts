import "server-only";

import sharp from "sharp";
import type { Gallery } from "@/lib/types";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const maxSizeBytes = 50 * 1024 * 1024;

export function assertPhotoFile(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Only JPG, PNG, WebP, HEIC, and HEIF images are supported.");
  }
  if (file.size > maxSizeBytes) {
    throw new Error("Each photo must be 50 MB or smaller.");
  }
}

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function watermarkSvg(gallery: Gallery, width: number, height: number) {
  const text = escapeXml(gallery.watermark_text || "PROOF - PURCHASE TO DOWNLOAD");
  const opacity = Number(gallery.watermark_opacity ?? 0.28);
  const identifier = escapeXml(gallery.slug);
  if (gallery.watermark_layout === "center") {
    return Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <g opacity="${opacity}" fill="#ffffff" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">
          <text x="${width / 2}" y="${height / 2}" font-size="${Math.max(42, Math.round(width / 18))}" font-weight="700">${text}</text>
          <text x="${width / 2}" y="${height / 2 + 56}" font-size="24" letter-spacing="3">${identifier}</text>
        </g>
      </svg>
    `);
  }
  const spacing = gallery.watermark_spacing || 320;
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse" patternTransform="rotate(${gallery.watermark_angle || -32})">
          <text x="0" y="${spacing / 2}" fill="#ffffff" opacity="${opacity}" font-size="${Math.max(24, gallery.watermark_size / 4)}" font-family="Arial, Helvetica, sans-serif" font-weight="700">${text}</text>
          <text x="0" y="${spacing / 2 + 34}" fill="#ffffff" opacity="${Math.max(0.12, opacity - 0.08)}" font-size="18" font-family="Arial, Helvetica, sans-serif">${identifier}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>
  `);
}

export async function makePreview(original: Buffer, gallery: Gallery) {
  const base = sharp(original).rotate().resize({ width: 1600, withoutEnlargement: true });
  const metadata = await base.metadata();
  const width = metadata.width ?? 1600;
  const height = metadata.height ?? 1200;
  const preview = await base
    .composite([{ input: watermarkSvg(gallery, width, height), blend: "over" }])
    .jpeg({ quality: 62, mozjpeg: true })
    .toBuffer();
  return { buffer: preview, width, height, contentType: "image/jpeg" };
}
