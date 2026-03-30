"use client";

import { useEffect, useState } from "react";
import type {
  LessonGenerationResult,
  QuestionTypeHint
} from "@/features/upload/types";

type LessonGeneratorPanelProps = {
  fileId: string;
  questionTypeHint: QuestionTypeHint;
};

export function LessonGeneratorPanel({
  fileId,
  questionTypeHint
}: LessonGeneratorPanelProps) {
  const [result, setResult] = useState<LessonGenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileId, questionTypeHint })
      });

      const payload = (await response.json()) as LessonGenerationResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Lesson generation request failed.");
      }

      setResult(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected generation error."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void handleGenerate();
  }, []);

  async function handleExportPpt() {
    if (!result?.slideDraft) {
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
        body: JSON.stringify({ slideDraft: result.slideDraft })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "PPT export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const fileName =
        result.slideDraft.coverMetadata?.examTitle ||
        result.slideDraft.title ||
        "lesson-draft";
      anchor.download = `${fileName}.pptx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
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
    <section className="status-panel generator-panel">
      <div className="generator-header">
        <div>
          <p className="status-title">Lesson draft</p>
          <p className="status-copy">
            Upload is done. Your lesson draft is generated automatically.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={handleExportPpt}
          type="button"
          disabled={!result || isExporting || isLoading}
        >
          {isExporting
            ? "Exporting..."
            : result
              ? "Download PPTX"
              : "Preparing PPTX..."}
        </button>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {!result && isLoading ? (
        <div className="generation-loading">
          <p className="meta-label">Generating</p>
          <p className="meta-value">Building your two-slide lesson draft...</p>
        </div>
      ) : null}

      {result ? (
        <div className="generator-result">
          <div className="generator-meta">
            <div>
              <p className="meta-label">OCR provider</p>
              <p className="meta-value">{result.ocrResult.provider}</p>
            </div>
            <div>
              <p className="meta-label">Question type</p>
              <p className="meta-value">{result.parseResult.questionType}</p>
            </div>
            <div>
              <p className="meta-label">Title</p>
              <p className="meta-value">{result.slideDraft.title}</p>
            </div>
          </div>

          <div className="slide-draft-stack">
            {result.slideDraft.slides.map((slide) => (
              <article className="slide-preview-card" key={slide.id}>
                <div className="slide-preview-inner">
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
        </div>
      ) : null}
    </section>
  );
}
