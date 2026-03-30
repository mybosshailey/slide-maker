"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { questionTypeOptions } from "@/features/problem-parse/question-options";
import type {
  CoverMetadata,
  LessonGenerationResult,
  QuestionTypeHint,
  UploadResponse
} from "@/features/upload/types";

type UploadState = "idle" | "uploading" | "success" | "error";

export function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemNumberEditedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [questionTypeHint, setQuestionTypeHint] = useState<QuestionTypeHint>("auto");
  const [examTitle, setExamTitle] = useState("2024학년도 대학수학능력시험 해설 강의");
  const [itemNumber, setItemNumber] = useState("");
  const [instructorName, setInstructorName] = useState("김혜린 T");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [serverFile, setServerFile] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDetectingItemNumber, setIsDetectingItemNumber] = useState(false);

  const helperText = useMemo(() => {
    if (uploadState === "uploading") return "Preparing your PPTX...";
    if (uploadState === "success") return "Your PPTX is ready.";
    if (uploadState === "error") return errorMessage ?? "Upload failed.";
    return "Drop a JPG or PNG file here.";
  }, [errorMessage, uploadState]);

  async function detectItemNumber(file: File) {
    try {
      setIsDetectingItemNumber(true);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/detect-item-number", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { itemNumber?: string | null };

      if (!itemNumberEditedRef.current && payload.itemNumber) {
        setItemNumber(payload.itemNumber);
      }
    } finally {
      setIsDetectingItemNumber(false);
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadState("error");
      setErrorMessage("Please upload an image file.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setSelectedFile(file);
    itemNumberEditedRef.current = false;
    setItemNumber("");
    setServerFile(null);
    setUploadState("idle");
    setErrorMessage(null);

    void detectItemNumber(file);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0] ?? null);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function uploadSelectedFile() {
    if (!selectedFile) {
      setUploadState("error");
      setErrorMessage("Select an image before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("questionTypeHint", questionTypeHint);
    formData.append("examTitle", examTitle);
    formData.append("itemNumber", itemNumber.replace(/[^0-9]/g, ""));
    formData.append("instructorName", instructorName);

    try {
      setUploadState("uploading");
      setErrorMessage(null);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Upload failed.");
      }

      const uploadPayload = (await response.json()) as UploadResponse;
      setServerFile(uploadPayload);

      const lessonResponse = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileId: uploadPayload.fileId,
          questionTypeHint: uploadPayload.questionTypeHint,
          coverMetadata: uploadPayload.coverMetadata
        })
      });

      const lessonPayload = (await lessonResponse.json()) as LessonGenerationResult & {
        error?: string;
      };

      if (!lessonResponse.ok) {
        throw new Error(lessonPayload.error ?? "Lesson generation failed.");
      }

      const exportResponse = await fetch("/api/export-ppt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          slideDraft: lessonPayload.slideDraft
        })
      });

      if (!exportResponse.ok) {
        const payload = (await exportResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "PPT export failed.");
      }

      const blob = await exportResponse.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const fileName =
        lessonPayload.slideDraft.coverMetadata?.examTitle ||
        lessonPayload.slideDraft.title ||
        "lesson-draft";
      anchor.download = `${fileName}.pptx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setUploadState("success");
    } catch (error) {
      setUploadState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected upload error."
      );
    }
  }

  return (
    <section className="upload-card">
      <div
        className={`dropzone${isDragging ? " is-dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg"
          onChange={onInputChange}
        />
        <div className="dropzone-shell">
          <div>
            <p className="dropzone-title">Drag and drop your passage image</p>
            <p className="dropzone-copy">{helperText}</p>
          </div>
        </div>
      </div>

      {previewUrl ? (
        <div className="preview-panel">
          <div className="preview-frame">
            <img alt="Uploaded preview" className="preview-image" src={previewUrl} />
          </div>
          <div className="preview-grid">
            <div className="hint-field">
              <label className="hint-label" htmlFor="exam-title">
                시험명
              </label>
              <input
                id="exam-title"
                className="hint-select"
                value={examTitle}
                onChange={(event) => setExamTitle(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                type="text"
                placeholder="2024학년도 대학수학능력시험 해설 강의"
              />
              <label className="hint-label" htmlFor="item-number">
                문항 번호
              </label>
              <input
                id="item-number"
                className="hint-select"
                value={itemNumber}
                onChange={(event) =>
                  {
                    itemNumberEditedRef.current = true;
                    setItemNumber(event.target.value.replace(/[^0-9]/g, ""));
                  }
                }
                onClick={(event) => event.stopPropagation()}
                type="text"
                inputMode="numeric"
                placeholder="34"
              />
              {isDetectingItemNumber ? (
                <p className="meta-label">문항 번호를 자동 인식하는 중...</p>
              ) : null}
              <label className="hint-label" htmlFor="instructor-name">
                강사명
              </label>
              <input
                id="instructor-name"
                className="hint-select"
                value={instructorName}
                onChange={(event) => setInstructorName(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                type="text"
                placeholder="김혜린 T"
              />
              <label className="hint-label" htmlFor="question-type-hint">
                Problem type
              </label>
              <select
                id="question-type-hint"
                className="hint-select"
                value={questionTypeHint}
                onChange={(event) =>
                  setQuestionTypeHint(event.target.value as QuestionTypeHint)
                }
              >
                {questionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="preview-meta">
              <div className="file-chip">
                <p className="meta-label">Selected file</p>
                <p className="meta-value">{selectedFile?.name}</p>
              </div>
              <button
              className="primary-button"
              onClick={uploadSelectedFile}
              type="button"
              disabled={uploadState === "uploading"}
            >
                {uploadState === "uploading" ? "Preparing PPTX..." : "Download PPTX"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {serverFile ? (
        <div className="status-panel">
          <p className="status-title">PPTX prepared</p>
          <p className="status-copy">
            {serverFile.originalName} has been uploaded and turned into a lesson file.
          </p>
        </div>
      ) : null}
    </section>
  );
}
