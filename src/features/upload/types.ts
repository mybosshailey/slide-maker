export type UploadResponse = {
  fileId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  previewUrl: string;
  questionTypeHint: QuestionTypeHint;
  coverMetadata: CoverMetadata;
};

export type OCRResult = {
  fileId: string;
  rawText: string;
  paragraphs: string[];
  provider: "openai" | "mock";
};

export type QuestionType =
  | "purpose"
  | "emotion-change"
  | "claim"
  | "underline-meaning"
  | "gist"
  | "topic"
  | "title"
  | "grammar"
  | "vocabulary"
  | "blank"
  | "irrelevant-sentence"
  | "sentence-order"
  | "sentence-insertion"
  | "summary-blank"
  | "unknown";

export type QuestionTypeHint = QuestionType | "auto";

export type ChoicePlacement = "separate" | "embedded-in-passage" | "mixed";

export type ChoiceItem = {
  label: string;
  text: string;
};

export type PassageBlock = {
  kind:
    | "paragraph"
    | "blank"
    | "ordered-paragraph"
    | "insert-position";
  text: string;
  marker?: string;
};

export type ProblemParseResult = {
  fileId: string;
  itemNumber?: string;
  instruction: string;
  detectedQuestionType: QuestionType;
  questionType: QuestionType;
  questionTypeSource: "auto" | "user";
  choicePlacement: ChoicePlacement;
  passage: string;
  passageBlocks: PassageBlock[];
  choices: ChoiceItem[];
  promptBox?: string;
  summaryText?: string;
  provider: "rule-based";
};

export type AnalysisSection = {
  heading: string;
  bullets: string[];
  teacherNotes: string[];
};

export type AnalysisResult = {
  fileId: string;
  documentTitle: string;
  summary: string;
  sections: AnalysisSection[];
  provider: "openai" | "mock";
};

export type CoverMetadata = {
  examTitle: string;
  subjectLabel: "영어 영역";
  itemNumber: string;
  instructorName: string;
};

export type SlideDraftSlide = {
  id: string;
  kind: "cover" | "passage-split" | "passage-full" | "choices";
  title: string;
  headerText?: string;
  background: "#000000";
  color: "#ffffff";
  widthRatio: number;
  content: string[];
  accentText?: string;
  footerNotes?: string[];
};

export type SlideDraft = {
  fileId: string;
  title: string;
  coverMetadata: CoverMetadata;
  slides: SlideDraftSlide[];
  provider: "rule-based";
};

export type LessonGenerationResult = {
  ocrResult: OCRResult;
  parseResult: ProblemParseResult;
  analysisResult: AnalysisResult;
  slideDraft: SlideDraft;
};
