import { NextResponse } from "next/server";
import { runOCR } from "@/features/ocr/service";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fileId?: string;
  };

  if (!body.fileId) {
    return NextResponse.json({ error: "fileId is required." }, { status: 400 });
  }

  try {
    const result = await runOCR(body.fileId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OCR processing failed."
      },
      { status: 500 }
    );
  }
}
