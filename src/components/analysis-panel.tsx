"use client";

import { useState } from "react";
import type { AnalysisResult, OCRResult } from "@/features/upload/types";

type AnalysisPanelProps = {
  ocrResult: OCRResult;
};

export function AnalysisPanel({ ocrResult }: AnalysisPanelProps) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAnalyze() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ocrResult })
      });

      const payload = (await response.json()) as AnalysisResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis request failed.");
      }

      setAnalysisResult(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected analysis error."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="status-panel analysis-panel">
      <div className="ocr-header">
        <div>
          <p className="status-title">Text analysis step</p>
          <p className="status-copy">
            Turn OCR output into slide-ready structure with a title, summary, and
            teacher-focused sections.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={handleAnalyze}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Run analysis"}
        </button>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {analysisResult ? (
        <div className="analysis-result">
          <p className="meta-label">Provider</p>
          <p className="meta-value">{analysisResult.provider}</p>
          <p className="meta-label">Document title</p>
          <p className="meta-value">{analysisResult.documentTitle}</p>
          <p className="meta-label">Summary</p>
          <p className="status-copy analysis-summary">{analysisResult.summary}</p>
          <div className="analysis-sections">
            {analysisResult.sections.map((section, index) => (
              <article className="analysis-section-card" key={`${section.heading}-${index}`}>
                <p className="status-title analysis-section-title">{section.heading}</p>
                <ul className="analysis-list">
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={`${section.heading}-bullet-${bulletIndex}`}>{bullet}</li>
                  ))}
                </ul>
                <p className="meta-label">Teacher notes</p>
                <ul className="analysis-list teacher-notes">
                  {section.teacherNotes.map((note, noteIndex) => (
                    <li key={`${section.heading}-note-${noteIndex}`}>{note}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
