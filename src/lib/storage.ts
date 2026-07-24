import "server-only";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  get as getVercelBlob,
  issueSignedToken,
  presignUrl,
  put as putVercelBlob,
} from "@vercel/blob";
import { Readable } from "node:stream";
import { getEnv, requireEnv } from "@/lib/env";

let client: S3Client | null = null;

function getS3() {
  if (!client) {
    const env = getEnv();
    client = new S3Client({
      endpoint: requireEnv("BLOB_ENDPOINT"),
      region: env.BLOB_REGION,
      forcePathStyle: env.BLOB_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: requireEnv("BLOB_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("BLOB_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

export async function putBlob({
  bucket,
  key,
  body,
  contentType,
}: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const env = getEnv();
  if (env.STORAGE_DRIVER === "vercel-blob") {
    await putVercelBlob(key, body, {
      access: bucket === env.BLOB_ORIGINALS_BUCKET ? "private" : "public",
      allowOverwrite: true,
      contentType,
      cacheControlMaxAge: bucket === env.BLOB_PREVIEWS_BUCKET ? 60 * 60 * 24 * 365 : 60,
    });
    return;
  }
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: bucket.includes("preview") ? "public, max-age=31536000, immutable" : "private, max-age=0",
    }),
  );
}

export async function getBlobStream(bucket: string, key: string) {
  const env = getEnv();
  if (env.STORAGE_DRIVER === "vercel-blob") {
    const response = await getVercelBlob(key, {
      access: bucket === env.BLOB_ORIGINALS_BUCKET ? "private" : "public",
    });
    if (!response || response.statusCode !== 200) {
      throw new Error(`Blob not found: ${key}`);
    }
    return Readable.fromWeb(response.stream as unknown as Parameters<typeof Readable.fromWeb>[0]);
  }
  const response = await getS3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return response.Body as Readable;
}

export async function getOriginalSignedUrl(key: string) {
  const env = getEnv();
  if (env.STORAGE_DRIVER === "vercel-blob") {
    const signedToken = await issueSignedToken({
      pathname: key,
      operations: ["get"],
      validUntil: Date.now() + 60 * 15 * 1000,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      access: "private",
      operation: "get",
      pathname: key,
      validUntil: Date.now() + 60 * 15 * 1000,
    });
    return presignedUrl;
  }
  return getSignedUrl(
    getS3(),
    new GetObjectCommand({
      Bucket: env.BLOB_ORIGINALS_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${key.split("/").pop() ?? "photo"}"`,
    }),
    { expiresIn: 60 * 15 },
  );
}
