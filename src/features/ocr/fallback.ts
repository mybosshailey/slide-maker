import type { OCRResult } from "@/features/upload/types";

export function buildMockOCRResult(fileId: string): OCRResult {
  const rawText =
    "This is a mock OCR result. Connect the OpenAI API key to replace this placeholder with extracted English passage text. The upload pipeline is ready for the real OCR step.";

  return {
    fileId,
    rawText,
    paragraphs: [
      "This is a mock OCR result.",
      "Connect the OpenAI API key to replace this placeholder with extracted English passage text.",
      "The upload pipeline is ready for the real OCR step."
    ],
    provider: "mock"
  };
}
