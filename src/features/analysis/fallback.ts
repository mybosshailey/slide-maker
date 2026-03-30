import type { AnalysisResult, ProblemParseResult } from "@/features/upload/types";

function sentenceChunks(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function buildMockAnalysisResult(parseResult: ProblemParseResult): AnalysisResult {
  const sourceText = parseResult.passage || parseResult.instruction;
  const sentences = sentenceChunks(sourceText);
  const headingSeed = sentences[0] ?? "Uploaded Passage";

  return {
    fileId: parseResult.fileId,
    documentTitle: headingSeed.slice(0, 60),
    summary: sentences.slice(0, 2).join(" "),
    sections: [
      {
        heading: "Key Passage Points",
        bullets: sentences.slice(0, 3),
        teacherNotes: [
          "Use this section to introduce the overall topic before diving into details.",
          "Check OCR quality before generating slides from this analysis."
        ]
      },
      {
        heading: "Teaching Focus",
        bullets: sentences.slice(3, 6).length
          ? sentences.slice(3, 6)
          : ["Add OCR output with more content to generate richer teaching points."],
        teacherNotes: [
          "Highlight vocabulary or sentence structures that should be emphasized in class."
        ]
      }
    ],
    provider: "mock"
  };
}
