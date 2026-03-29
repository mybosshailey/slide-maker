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
