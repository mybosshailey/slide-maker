import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { head, put } from "@vercel/blob";

export const uploadDir = path.join(process.cwd(), "uploads");

export function isBlobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getUploadPath(fileName: string) {
  return path.join(uploadDir, fileName);
}

export function getLocalUploadPreviewPath(fileName: string) {
  return `/api/uploads/${encodeURIComponent(fileName)}`;
}

export async function saveUpload(
  fileName: string,
  buffer: Buffer,
  contentType: string
) {
  if (isBlobStorageEnabled()) {
    const blob = await put(fileName, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType
    });

    return {
      fileId: blob.pathname,
      previewUrl: blob.url
    };
  }

  await mkdir(uploadDir, { recursive: true });
  await writeFile(getUploadPath(fileName), buffer);

  return {
    fileId: fileName,
    previewUrl: getLocalUploadPreviewPath(fileName)
  };
}

export async function readUpload(fileId: string) {
  if (isBlobStorageEnabled()) {
    const metadata = await head(fileId);
    const response = await fetch(metadata.url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Uploaded blob could not be fetched.");
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType: metadata.contentType,
      previewUrl: metadata.url
    };
  }

  return {
    buffer: await readFile(getUploadPath(fileId)),
    mimeType: inferMimeType(fileId),
    previewUrl: getLocalUploadPreviewPath(fileId)
  };
}

export async function getUploadPreviewUrl(fileId: string) {
  if (isBlobStorageEnabled()) {
    const metadata = await head(fileId);
    return metadata.url;
  }

  return getLocalUploadPreviewPath(fileId);
}

function inferMimeType(fileId: string) {
  const extension = path.extname(fileId).toLowerCase();

  if (extension === ".png") return "image/png";
  return "image/jpeg";
}
