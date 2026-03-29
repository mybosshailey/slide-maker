"use client";

import { useState } from "react";
import { ProblemParsePanel } from "@/components/problem-parse-panel";
import type { OCRResult } from "@/features/upload/types";

type OCRPanelProps = {
  fileId: string;
};

export function OCRPanel({ fileId }: OCRPanelProps) {
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRunOCR() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileId })
      });

      const payload = (await response.json()) as OCRResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "OCR request failed.");
      }

      setOcrResult(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected OCR error."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="status-panel ocr-panel">
      <div className="ocr-header">
        <div>
          <p className="status-title">OCR step</p>
          <p className="status-copy">
            Extract English passage text from the uploaded image. If no OpenAI API
            key is set, a mock OCR result is returned so we can keep building the
            flow.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={handleRunOCR}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? "Running OCR..." : "Run OCR"}
        </button>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {ocrResult ? (
        <div className="ocr-result">
          <p className="meta-label">Provider</p>
          <p className="meta-value">{ocrResult.provider}</p>
          <p className="meta-label">Extracted text</p>
          <div className="ocr-text-block">
            {ocrResult.paragraphs.map((paragraph, index) => (
              <p key={`${ocrResult.fileId}-${index}`}>{paragraph}</p>
            ))}
          </div>
          <ProblemParsePanel ocrResult={ocrResult} />
        </div>
      ) : null}
    </section>
  );
}
