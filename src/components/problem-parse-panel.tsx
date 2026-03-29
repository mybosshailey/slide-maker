"use client";

import { useState } from "react";
import { AnalysisPanel } from "@/components/analysis-panel";
import type { OCRResult, ProblemParseResult } from "@/features/upload/types";

type ProblemParsePanelProps = {
  ocrResult: OCRResult;
};

export function ProblemParsePanel({ ocrResult }: ProblemParsePanelProps) {
  const [parseResult, setParseResult] = useState<ProblemParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleParse() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/problem-parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ocrResult })
      });

      const payload = (await response.json()) as ProblemParseResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Problem parse request failed.");
      }

      setParseResult(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected problem parse error."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="status-panel analysis-panel">
      <div className="ocr-header">
        <div>
          <p className="status-title">Problem parsing step</p>
          <p className="status-copy">
            Split OCR text into item number, instruction, passage, and choices before
            slide analysis.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={handleParse}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? "Parsing..." : "Parse problem"}
        </button>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {parseResult ? (
        <div className="analysis-result">
          <p className="meta-label">Question type</p>
          <p className="meta-value">{parseResult.questionType}</p>
          <p className="meta-label">Choice placement</p>
          <p className="meta-value">{parseResult.choicePlacement}</p>
          {parseResult.itemNumber ? (
            <>
              <p className="meta-label">Item number</p>
              <p className="meta-value">{parseResult.itemNumber}</p>
            </>
          ) : null}
          <p className="meta-label">Instruction</p>
          <p className="status-copy analysis-summary">{parseResult.instruction}</p>
          <p className="meta-label">Passage</p>
          <div className="ocr-text-block">
            {parseResult.passageBlocks.map((block, index) => (
              <p key={`${block.kind}-${index}`}>
                <strong>{block.kind}</strong>: {block.text}
              </p>
            ))}
          </div>
          {parseResult.choices.length ? (
            <>
              <p className="meta-label">Choices</p>
              <ul className="analysis-list">
                {parseResult.choices.map((choice) => (
                  <li key={choice.label || choice.text}>
                    {choice.label ? `${choice.label} ` : ""}
                    {choice.text}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <AnalysisPanel parseResult={parseResult} />
        </div>
      ) : null}
    </section>
  );
}
