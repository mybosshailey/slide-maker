"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UploadResponse } from "@/features/upload/types";

type UploadState = "idle" | "uploading" | "success" | "error";

export function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [serverFile, setServerFile] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (uploadState === "uploading") return "Uploading image...";
    if (uploadState === "success") return "Upload complete. Preview is ready.";
    if (uploadState === "error") return errorMessage ?? "Upload failed.";
    return "Drop a JPG or PNG file here, or choose one from your device.";
  }, [errorMessage, uploadState]);

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
    setServerFile(null);
    setUploadState("idle");
    setErrorMessage(null);
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

      const payload = (await response.json()) as UploadResponse;
      setServerFile(payload);
      setUploadState("success");
      router.push(
        `/result/${encodeURIComponent(payload.fileName)}?originalName=${encodeURIComponent(
          payload.originalName
        )}&size=${payload.size}`
      );
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
        <p className="dropzone-title">Drag and drop your passage image</p>
        <p className="dropzone-copy">{helperText}</p>
      </div>

      {previewUrl ? (
        <div className="preview-panel">
          <div className="preview-frame">
            <img alt="Uploaded preview" className="preview-image" src={previewUrl} />
          </div>
          <div className="preview-meta">
            <div>
              <p className="meta-label">Selected file</p>
              <p className="meta-value">{selectedFile?.name}</p>
            </div>
            <button
              className="primary-button"
              onClick={uploadSelectedFile}
              type="button"
              disabled={uploadState === "uploading"}
            >
              {uploadState === "uploading" ? "Uploading..." : "Upload image"}
            </button>
          </div>
        </div>
      ) : null}

      {serverFile ? (
        <div className="status-panel">
          <p className="status-title">Upload saved</p>
          <p className="status-copy">
            {serverFile.originalName} is now stored through the API route and ready
            for the OCR step.
          </p>
        </div>
      ) : null}
    </section>
  );
}
