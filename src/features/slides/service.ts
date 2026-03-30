import type {
  AnalysisResult,
  CoverMetadata,
  ProblemParseResult,
  SlideDraft,
  SlideDraftSlide
} from "@/features/upload/types";

type GlossaryNote = {
  keyword: string;
  text: string;
};

function formatInstructionHeader(
  parseResult: ProblemParseResult,
  coverMetadata?: CoverMetadata
) {
  const itemNumber = coverMetadata?.itemNumber || parseResult.itemNumber;

  if (itemNumber) {
    return `${itemNumber}. ${parseResult.instruction}`;
  }

  return parseResult.instruction;
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractGlossaryNotes(text: string) {
  const notePattern = /(\*{1,3}\s*[A-Za-z][^*]+?)(?=(?:\s+\*{1,3}\s*[A-Za-z])|$)/g;
  const matches = [...text.matchAll(notePattern)];

  if (!matches.length) {
    return {
      cleanedText: normalizeText(text),
      notes: [] as GlossaryNote[]
    };
  }

  const notes = matches
    .map((match) => match[1]?.trim())
    .filter(Boolean)
    .map((note) => ({
      text: note,
      keyword: note.replace(/^\*+\s*/, "").split(":")[0]?.trim().toLowerCase() ?? ""
    }));

  const cleanedText = normalizeText(text.replace(notePattern, " "));

  return { cleanedText, notes };
}

function normalizeProvidedNotes(notes?: string[]) {
  return (notes ?? [])
    .map((note) => note.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((note) => ({
      text: note,
      keyword: note.replace(/^\*+\s*/, "").split(":")[0]?.trim().toLowerCase() ?? ""
    }));
}

function compactPassageBlocks(parseResult: ProblemParseResult) {
  return parseResult.passageBlocks
    .map((block) => {
      if (block.kind === "blank") {
        return "____________________";
      }

      if (block.marker) {
        return `(${block.marker}) ${block.text}`;
      }

      return block.text.trim();
    })
    .filter(Boolean)
    .join(" ");
}

function splitPassageIntoTwoSlides(passage: string) {
  const normalized = normalizeText(passage);

  if (!normalized) {
    return ["", ""];
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length < 2) {
    const midpoint = Math.ceil(normalized.length / 2);
    return [normalized.slice(0, midpoint).trim(), normalized.slice(midpoint).trim()];
  }

  const totalWords = sentences.reduce(
    (count, sentence) => count + sentence.split(/\s+/).filter(Boolean).length,
    0
  );

  let runningWords = 0;
  let splitIndex = Math.ceil(sentences.length / 2);

  for (let index = 0; index < sentences.length; index += 1) {
    runningWords += sentences[index].split(/\s+/).filter(Boolean).length;

    if (runningWords >= totalWords / 2) {
      splitIndex = index + 1;
      break;
    }
  }

  splitIndex = Math.min(Math.max(splitIndex, 1), sentences.length - 1);

  return [
    sentences.slice(0, splitIndex).join(" ").trim(),
    sentences.slice(splitIndex).join(" ").trim()
  ];
}

function formatChoiceLines(parseResult: ProblemParseResult) {
  if (!parseResult.choices.length) {
    return ["No separate choices detected."];
  }

  return parseResult.choices.map((choice, index) => {
    const fallbackLabel = ["①", "②", "③", "④", "⑤"][index] ?? "";
    const label = choice.label || fallbackLabel;
    return label ? `${label} ${choice.text}` : choice.text;
  });
}

function pickNotesForText(text: string, notes: GlossaryNote[]) {
  const loweredText = text.toLowerCase();
  const matched: GlossaryNote[] = [];
  const unmatched: GlossaryNote[] = [];

  notes.forEach((note) => {
    if (note.keyword && loweredText.includes(note.keyword)) {
      matched.push(note);
      return;
    }

    unmatched.push(note);
  });

  return {
    matched: matched.map((note) => note.text),
    unmatched
  };
}

function buildPassageSlides(
  parseResult: ProblemParseResult,
  headerText: string,
  cleanedPassage: string,
  notes: GlossaryNote[]
) {
  const [partOne, partTwo] = splitPassageIntoTwoSlides(cleanedPassage);
  const partOneNotes = pickNotesForText(partOne, notes);
  const partTwoNotes = pickNotesForText(partTwo, partOneNotes.unmatched);

  const slides: SlideDraftSlide[] = [
    {
      id: `${parseResult.fileId}-passage-1`,
      kind: "passage-split",
      title: "Passage (1)",
      headerText,
      background: "#000000",
      color: "#ffffff",
      widthRatio: 0.8,
      content: [partOne],
      footerNotes: partOneNotes.matched
    },
    {
      id: `${parseResult.fileId}-passage-2`,
      kind: "passage-split",
      title: "Passage (2)",
      headerText,
      background: "#000000",
      color: "#ffffff",
      widthRatio: 0.8,
      content: [partTwo],
      footerNotes: [
        ...partTwoNotes.matched,
        ...partTwoNotes.unmatched.map((note) => note.text)
      ]
    }
  ];

  return slides;
}

export function generateSlideDraft(
  parseResult: ProblemParseResult,
  analysisResult: AnalysisResult,
  coverMetadata?: CoverMetadata
): SlideDraft {
  const normalizedCoverMetadata: CoverMetadata = {
    examTitle: coverMetadata?.examTitle || "2024학년도 대학수학능력시험 해설 강의",
    subjectLabel: "영어 영역",
    itemNumber: coverMetadata?.itemNumber || parseResult.itemNumber || "",
    instructorName: coverMetadata?.instructorName || "김혜린 T"
  };

  const itemNumberText = normalizedCoverMetadata.itemNumber
    ? `${normalizedCoverMetadata.itemNumber}번`
    : "";
  const headerText = formatInstructionHeader(parseResult, normalizedCoverMetadata);
  const sourcePassage = compactPassageBlocks(parseResult);
  const ocrNotes = normalizeProvidedNotes(parseResult.glossaryNotes);
  const { cleanedText, notes: inferredNotes } = extractGlossaryNotes(sourcePassage);
  const notes = ocrNotes.length ? ocrNotes : inferredNotes;
  const passageSlides = buildPassageSlides(
    parseResult,
    headerText,
    cleanedText,
    notes
  );
  const choiceLines = formatChoiceLines(parseResult);

  return {
    fileId: parseResult.fileId,
    title: analysisResult.documentTitle || "Lesson Draft",
    coverMetadata: normalizedCoverMetadata,
    provider: "rule-based",
    slides: [
      {
        id: `${parseResult.fileId}-cover`,
        kind: "cover",
        title: normalizedCoverMetadata.examTitle,
        background: "#000000",
        color: "#ffffff",
        widthRatio: 1,
        content: [
          normalizedCoverMetadata.examTitle,
          normalizedCoverMetadata.subjectLabel
        ],
        accentText: itemNumberText || undefined
      },
      ...passageSlides,
      {
        id: `${parseResult.fileId}-choices-primary`,
        kind: "choices",
        title: "Choices",
        headerText,
        background: "#000000",
        color: "#ffffff",
        widthRatio: 0.86,
        content: choiceLines
      },
      {
        id: `${parseResult.fileId}-passage-full`,
        kind: "passage-full",
        title: "Full Passage",
        headerText,
        background: "#000000",
        color: "#ffffff",
        widthRatio: 0.86,
        content: [cleanedText],
        footerNotes: notes.map((note) => note.text)
      },
      {
        id: `${parseResult.fileId}-choices-secondary`,
        kind: "choices",
        title: "Choices Review",
        headerText,
        background: "#000000",
        color: "#ffffff",
        widthRatio: 0.86,
        content: choiceLines
      }
    ]
  };
}
