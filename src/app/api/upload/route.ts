import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getSafeFileName, getUploadPath, uploadDir } from "@/lib/upload-storage";
import type { CoverMetadata } from "@/features/upload/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const questionTypeHint = formData.get("questionTypeHint");
  const examTitle = formData.get("examTitle");
  const itemNumber = formData.get("itemNumber");
  const instructorName = formData.get("instructorName");

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Image file is required." },
      { status: 400 }
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are supported." },
      { status: 400 }
    );
  }

  const bytes = await image.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = getSafeFileName(image.name);
  const fileName = `${Date.now()}-${safeName}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(getUploadPath(fileName), buffer);

  const coverMetadata: CoverMetadata = {
    examTitle:
      typeof examTitle === "string" && examTitle.trim()
        ? examTitle.trim()
        : "2024학년도 대학수학능력시험 해설 강의",
    subjectLabel: "영어 영역",
    itemNumber:
      typeof itemNumber === "string" && itemNumber.trim()
        ? itemNumber.trim()
        : "",
    instructorName:
      typeof instructorName === "string" && instructorName.trim()
        ? instructorName.trim()
        : "김혜린 T"
  };

  return NextResponse.json({
    fileId: fileName,
    fileName,
    originalName: image.name,
    mimeType: image.type,
    size: image.size,
    previewUrl: `/api/uploads/${encodeURIComponent(fileName)}`,
    questionTypeHint:
      typeof questionTypeHint === "string" ? questionTypeHint : "auto",
    coverMetadata
  });
}
