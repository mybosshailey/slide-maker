import path from "path";

export const uploadDir = path.join(process.cwd(), "uploads");

export function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getUploadPath(fileName: string) {
  return path.join(uploadDir, fileName);
}
