import { readFile } from "fs/promises";
import path from "path";
import type { OCRResult } from "@/features/upload/types";
import { buildMockOCRResult } from "@/features/ocr/fallback";
import { hasOpenAIKey, extractTextFromImageWithOpenAI } from "@/lib/openai";
import { getUploadPath } from "@/lib/upload-storage";

function toParagraphs(text: string) {
  return text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function inferMimeType(fileId: string) {
  const extension = path.extname(fileId).toLowerCase();

  if (extension === ".png") return "image/png";
  return "image/jpeg";
}

export async function runOCR(fileId: string): Promise<OCRResult> {
  if (!hasOpenAIKey()) {
    return buildMockOCRResult(fileId);
  }

  const fileBuffer = await readFile(getUploadPath(fileId));
  const mimeType = inferMimeType(fileId);
  const rawText = await extractTextFromImageWithOpenAI(
    fileBuffer.toString("base64"),
    mimeType
  );

  return {
    fileId,
    rawText,
    paragraphs: toParagraphs(rawText),
    provider: "openai"
  };
}
