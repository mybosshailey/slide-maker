export type UploadResponse = {
  fileId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  previewUrl: string;
};

export type OCRResult = {
  fileId: string;
  rawText: string;
  paragraphs: string[];
  provider: "openai" | "mock";
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
