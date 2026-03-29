import { LessonGeneratorPanel } from "@/components/lesson-generator-panel";
import type { QuestionTypeHint } from "@/features/upload/types";

type ResultPageProps = {
  params: Promise<{
    fileName: string;
  }>;
  searchParams: Promise<{
    originalName?: string;
    size?: string;
    questionTypeHint?: QuestionTypeHint;
  }>;
};

function formatFileSize(size?: string) {
  const numericSize = Number(size);

  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return "Unknown size";
  }

  if (numericSize < 1024 * 1024) {
    return `${(numericSize / 1024).toFixed(1)} KB`;
  }

  return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ResultPage({
  params,
  searchParams
}: ResultPageProps) {
  const { fileName } = await params;
  const { originalName, size, questionTypeHint } = await searchParams;

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Upload Complete</p>
        <h1>Your image is now stored and ready for OCR.</h1>
        <p className="hero-copy">
          This result page confirms the upload flow end to end. The next step is
          wiring OCR and passage analysis into this saved file.
        </p>
      </section>

      <section className="result-layout">
        <div className="preview-panel">
          <div className="preview-frame">
            <img
              alt={originalName ?? "Uploaded file preview"}
              className="preview-image"
              src={`/api/uploads/${encodeURIComponent(fileName)}`}
            />
          </div>
        </div>

        <aside className="status-panel result-meta">
          <p className="status-title">Saved file</p>
          <div className="meta-stack">
            <div>
              <p className="meta-label">Original name</p>
              <p className="meta-value">{originalName ?? "Unknown file"}</p>
            </div>
            <div>
              <p className="meta-label">Server file id</p>
              <p className="meta-value">{fileName}</p>
            </div>
            <div>
              <p className="meta-label">File size</p>
              <p className="meta-value">{formatFileSize(size)}</p>
            </div>
            <div>
              <p className="meta-label">Problem type hint</p>
              <p className="meta-value">{questionTypeHint ?? "auto"}</p>
            </div>
          </div>
        </aside>
      </section>

      <LessonGeneratorPanel
        fileId={fileName}
        questionTypeHint={questionTypeHint ?? "auto"}
      />
    </main>
  );
}
