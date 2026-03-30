import type { AnalysisResult, ProblemParseResult } from "@/features/upload/types";
import { buildMockAnalysisResult } from "@/features/analysis/fallback";
import { createStructuredOpenAIResponse, hasOpenAIKey } from "@/lib/openai";

async function analyzeWithOpenAI(parseResult: ProblemParseResult): Promise<AnalysisResult> {
  const parsed = await createStructuredOpenAIResponse<
    Omit<AnalysisResult, "fileId" | "provider">
  >(
    [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Analyze the parsed content from a Korean CSAT-style English question for lesson-slide preparation. Focus on the actual passage content, not the choice labels. Return a concise documentTitle, one short summary, and 2 to 4 sections. Each section must have a heading, 2 to 4 bullets, and 1 to 2 teacherNotes. Keep the content concise and teacher-focused."
          },
          {
            type: "input_text",
            text: JSON.stringify(
              {
                instruction: parseResult.instruction,
                questionType: parseResult.questionType,
                passage: parseResult.passage,
                passageBlocks: parseResult.passageBlocks,
                choices: parseResult.choices
              },
              null,
              2
            )
          }
        ]
      }
    ],
    {
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
    },
    "analysis_result"
  );

  return {
    fileId: parseResult.fileId,
    documentTitle: parsed.documentTitle,
    summary: parsed.summary,
    sections: parsed.sections,
    provider: "openai"
  };
}

export async function runAnalysis(parseResult: ProblemParseResult): Promise<AnalysisResult> {
  if (!hasOpenAIKey()) {
    return buildMockAnalysisResult(parseResult);
  }

  return analyzeWithOpenAI(parseResult);
}
