import { readFile } from "fs/promises";
import path from "path";
import type { OCRResult } from "@/features/upload/types";
import { buildMockOCRResult } from "@/features/ocr/fallback";
import {
  extractStructuredProblemFromImageWithOpenAI,
  hasOpenAIKey
} from "@/lib/openai";
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
  const structured = await extractStructuredProblemFromImageWithOpenAI(
    fileBuffer.toString("base64"),
    mimeType
  );
  const rawText = [
    structured.itemNumber ? `${structured.itemNumber}.` : "",
    structured.instruction ?? "",
    structured.passageText,
    ...structured.glossaryNotes,
    ...structured.choices.map((choice, index) => {
      const fallbackLabel = ["①", "②", "③", "④", "⑤"][index] ?? "";
      const label = choice.label ?? fallbackLabel;
      return `${label} ${choice.text}`.trim();
    })
  ]
    .filter(Boolean)
    .join("\n");

  return {
    fileId,
    rawText,
    paragraphs: toParagraphs(rawText),
    itemNumber: structured.itemNumber?.replace(/[^0-9]/g, "") || undefined,
    instruction: structured.instruction ?? undefined,
    passageText: structured.passageText.trim() || undefined,
    glossaryNotes: structured.glossaryNotes.filter(Boolean),
    choices: structured.choices
      .filter((choice) => choice.text.trim())
      .map((choice, index) => ({
        label: choice.label?.trim() || ["①", "②", "③", "④", "⑤"][index] || "",
        text: choice.text.trim()
      })),
    provider: "openai"
  };
}
