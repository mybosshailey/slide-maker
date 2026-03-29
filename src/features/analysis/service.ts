import type { AnalysisResult, OCRResult } from "@/features/upload/types";
import { buildMockAnalysisResult } from "@/features/analysis/fallback";
import { hasOpenAIKey } from "@/lib/openai";

async function analyzeWithOpenAI(ocrResult: OCRResult): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      text: {
        format: {
          type: "json_schema",
          name: "analysis_result",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              documentTitle: { type: "string" },
              summary: { type: "string" },
              sections: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    heading: { type: "string" },
                    bullets: {
                      type: "array",
                      items: { type: "string" }
                    },
                    teacherNotes: {
                      type: "array",
                      items: { type: "string" }
                    }
                  },
                  required: ["heading", "bullets", "teacherNotes"]
                }
              }
            },
            required: ["documentTitle", "summary", "sections"]
          }
        }
      },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze the OCR text from an English reading passage for lesson-slide preparation. Return a concise documentTitle, one short summary, and 2 to 4 sections. Each section must have a heading, 2 to 4 bullets, and 1 to 2 teacherNotes. Keep the content concise and teacher-focused."
            },
            {
              type: "input_text",
              text: ocrResult.rawText
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`OpenAI analysis request failed: ${payload}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  const raw = payload.output_text?.trim();

  if (!raw) {
    throw new Error("OpenAI analysis response did not contain JSON output.");
  }

  const parsed = JSON.parse(raw) as Omit<AnalysisResult, "fileId" | "provider">;

  return {
    fileId: ocrResult.fileId,
    documentTitle: parsed.documentTitle,
    summary: parsed.summary,
    sections: parsed.sections,
    provider: "openai"
  };
}

export async function runAnalysis(ocrResult: OCRResult): Promise<AnalysisResult> {
  if (!hasOpenAIKey()) {
    return buildMockAnalysisResult(ocrResult);
  }

  return analyzeWithOpenAI(ocrResult);
}
