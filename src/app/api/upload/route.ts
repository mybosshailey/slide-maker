import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getSafeFileName, getUploadPath, uploadDir } from "@/lib/upload-storage";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

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

  return NextResponse.json({
    fileId: fileName,
    fileName,
    originalName: image.name,
    mimeType: image.type,
    size: image.size,
    previewUrl: `/api/uploads/${encodeURIComponent(fileName)}`
  });
}
