import {
  questionPatterns,
  questionTypeStemMap
} from "@/features/problem-parse/config";
import type {
  ChoiceItem,
  OCRResult,
  PassageBlock,
  ProblemParseResult,
  QuestionTypeHint
} from "@/features/upload/types";

function extractItemNumber(text: string) {
  const match = text.match(/^\s*(\d+)\.\s*/);
  return match?.[1];
}

function removeItemNumber(text: string) {
  return text.replace(/^\s*\d+\.\s*/, "").trim();
}

function findQuestionPattern(text: string) {
  return questionPatterns.find((pattern) => text.includes(pattern.stem));
}

function normalizeChoiceLabels(text: string) {
  return text
    .replace(/\b1[\.\)]\s*/g, "① ")
    .replace(/\b2[\.\)]\s*/g, "② ")
    .replace(/\b3[\.\)]\s*/g, "③ ")
    .replace(/\b4[\.\)]\s*/g, "④ ")
    .replace(/\b5[\.\)]\s*/g, "⑤ ");
}

function splitChoices(text: string) {
  const normalized = normalizeChoiceLabels(text);
  const matches = [...normalized.matchAll(/([①②③④⑤])\s*/g)];

  if (matches.length < 3) {
    return {
      passageText: normalized.trim(),
      choices: [] as ChoiceItem[]
    };
  }

  const firstChoiceIndex = matches[0]?.index ?? -1;

  if (firstChoiceIndex < 0) {
    return {
      passageText: normalized.trim(),
      choices: [] as ChoiceItem[]
    };
  }

  const passageText = normalized.slice(0, firstChoiceIndex).trim();
  const choiceArea = normalized.slice(firstChoiceIndex);
  const chunks = choiceArea
    .split(/(?=[①②③④⑤]\s*)/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const choices = chunks.map((chunk) => {
    const label = chunk[0] ?? "";
    return {
      label,
      text: chunk.slice(1).replace(/\s+/g, " ").trim()
    };
  });

  return { passageText, choices };
}

function buildPassageBlocks(
  questionType: ProblemParseResult["questionType"],
  passage: string
): PassageBlock[] {
  if (!passage.trim()) {
    return [] as PassageBlock[];
  }

  if (questionType === "sentence-order") {
    const segments = passage
      .split(/(?=\([A-C]\))/g)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length > 1) {
      return segments.map((segment): PassageBlock => ({
        kind: "ordered-paragraph",
        text: segment,
        marker: segment.match(/^\(([A-C])\)/)?.[1]
      }));
    }
  }

  if (questionType === "sentence-insertion") {
    const segments = passage
      .split(/(?=[①②③④⑤])/g)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length > 1) {
      return segments.map((segment): PassageBlock => ({
        kind: segment.match(/^[①②③④⑤]/) ? "insert-position" : "paragraph",
        text: segment
      }));
    }
  }

  if (questionType === "blank" || questionType === "summary-blank") {
    const segments = passage
      .split(/(_{3,}|\(A\)|\(B\))/g)
      .map((segment) => segment.trim())
      .filter(Boolean);

    return segments.map((segment): PassageBlock => ({
      kind: /^_{3,}$/.test(segment) || /^\([AB]\)$/.test(segment) ? "blank" : "paragraph",
      text: segment
    }));
  }

  const paragraphs = passage
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return paragraphs.map((paragraph): PassageBlock => ({
    kind: "paragraph",
    text: paragraph
  }));
}

function detectSummaryText(questionType: ProblemParseResult["questionType"], passage: string) {
  if (questionType !== "summary-blank") {
    return undefined;
  }

  const match = passage.match(/(In summary.*|\(A\).*)/i);
  return match?.[1];
}

function detectPromptBox(questionType: ProblemParseResult["questionType"], passage: string) {
  if (questionType !== "sentence-insertion") {
    return undefined;
  }

  const firstSentence = passage.match(/^(.*?[.!?])\s+/);
  return firstSentence?.[1]?.trim();
}

export function parseProblemFromOCR(
  ocrResult: OCRResult,
  questionTypeHint: QuestionTypeHint
): ProblemParseResult {
  const itemNumber = ocrResult.itemNumber || extractItemNumber(ocrResult.rawText);
  const textWithoutNumber = removeItemNumber(ocrResult.rawText);
  const pattern = findQuestionPattern(textWithoutNumber);

  let instruction = "문제 제시 문장을 찾지 못했습니다.";
  const detectedQuestionType = pattern?.questionType ?? "unknown";
  const questionType =
    questionTypeHint !== "auto" ? questionTypeHint : detectedQuestionType;
  let choicePlacement: ProblemParseResult["choicePlacement"] = "separate";
  let bodyText = textWithoutNumber;

  if (ocrResult.instruction?.trim()) {
    instruction = ocrResult.instruction.trim();
  } else if (pattern) {
    instruction = pattern.stem;
    choicePlacement = pattern.choicePlacement;
    bodyText = textWithoutNumber.split(pattern.stem).slice(1).join(pattern.stem).trim();
  }

  if (questionTypeHint !== "auto" && questionTypeStemMap[questionTypeHint]) {
    instruction = questionTypeStemMap[questionTypeHint] ?? instruction;
  }

  const structuredChoices = ocrResult.choices?.filter((choice) => choice.text.trim()) ?? [];
  const structuredPassageText = ocrResult.passageText?.trim();
  const { passageText, choices } =
    structuredPassageText || structuredChoices.length
      ? {
          passageText: structuredPassageText || bodyText.trim(),
          choices: structuredChoices
        }
      : splitChoices(bodyText);
  const passageBlocks = buildPassageBlocks(questionType, passageText);

  return {
    fileId: ocrResult.fileId,
    itemNumber,
    instruction,
    detectedQuestionType,
    questionType,
    questionTypeSource: questionTypeHint !== "auto" ? "user" : "auto",
    choicePlacement,
    passage: passageText,
    passageBlocks,
    choices,
    glossaryNotes: ocrResult.glossaryNotes,
    promptBox: detectPromptBox(questionType, passageText),
    summaryText: detectSummaryText(questionType, passageText),
    provider: "rule-based"
  };
}
