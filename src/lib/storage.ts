import "server-only";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  const response = await getS3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return response.Body as Readable;
}

export async function getOriginalSignedUrl(key: string) {
  const env = getEnv();
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
