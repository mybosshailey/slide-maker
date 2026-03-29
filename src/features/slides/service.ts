import type {
  AnalysisResult,
  ProblemParseResult,
  SlideDraft
} from "@/features/upload/types";

function compactPassageBlocks(parseResult: ProblemParseResult) {
  return parseResult.passageBlocks.map((block) => {
    if (block.kind === "blank") {
      return "_____";
    }

    if (block.marker) {
      return `(${block.marker}) ${block.text}`;
    }

    return block.text.trim();
  });
}

function compactChoices(parseResult: ProblemParseResult) {
  if (!parseResult.choices.length) {
    return ["No separate choices detected."];
  }

  return parseResult.choices.map((choice) =>
    choice.label ? `${choice.label} ${choice.text}` : choice.text
  );
}

export function generateSlideDraft(
  parseResult: ProblemParseResult,
  analysisResult: AnalysisResult
): SlideDraft {
  return {
    fileId: parseResult.fileId,
    title: analysisResult.documentTitle || "Lesson Draft",
    provider: "rule-based",
    slides: [
      {
        id: `${parseResult.fileId}-passage`,
        kind: "passage",
        title: analysisResult.documentTitle || "Passage",
        background: "#000000",
        color: "#ffffff",
        widthRatio: 0.66,
        content: compactPassageBlocks(parseResult)
      },
      {
        id: `${parseResult.fileId}-choices`,
        kind: "choices",
        title: "Choices",
        background: "#000000",
        color: "#ffffff",
        widthRatio: 0.5,
        content: compactChoices(parseResult)
      }
    ]
  };
}
