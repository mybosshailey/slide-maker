"use client";

import { useState } from "react";
import type {
  AnalysisResult,
  ProblemParseResult,
  SlideDraft
} from "@/features/upload/types";

type SlideDraftPanelProps = {
  parseResult: ProblemParseResult;
  analysisResult: AnalysisResult;
};

export function SlideDraftPanel({
  parseResult,
  analysisResult
}: SlideDraftPanelProps) {
  const [slideDraft, setSlideDraft] = useState<SlideDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGenerateDraft() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/slide-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ parseResult, analysisResult })
      });

      const payload = (await response.json()) as SlideDraft & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Slide draft request failed.");
      }

      setSlideDraft(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected slide draft error."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportPpt() {
    if (!slideDraft) {
      return;
    }

    try {
      setIsExporting(true);
      setErrorMessage(null);

      const response = await fetch("/api/export-ppt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ slideDraft })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "PPT export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slideDraft.title || "lesson-draft"}.pptx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected export error."
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="status-panel analysis-panel">
      <div className="ocr-header">
        <div>
          <p className="status-title">Slide draft step</p>
          <p className="status-copy">
            Build the MVP draft as two slides: one passage slide and one choices
            slide.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={handleGenerateDraft}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate slides"}
        </button>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {slideDraft ? (
        <div className="slide-draft-stack">
          <div className="slide-draft-actions">
            <button
              className="primary-button"
              onClick={handleExportPpt}
              type="button"
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Download PPTX"}
            </button>
          </div>
          {slideDraft.slides.map((slide) => (
            <article className="slide-preview-card" key={slide.id}>
              <div
                className={`slide-preview-inner ${
                  slide.kind === "choices" ? "is-choices" : "is-passage"
                }`}
              >
                <div
                  className="slide-text-column"
                  style={{ width: `${slide.widthRatio * 100}%` }}
                >
                  <p className="slide-preview-label">{slide.title}</p>
                  <div className="slide-preview-content">
                    {slide.content.map((line, index) => (
                      <p key={`${slide.id}-${index}`}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
