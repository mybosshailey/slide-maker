import { NextResponse } from "next/server";
import { runAnalysis } from "@/features/analysis/service";
import type { OCRResult } from "@/features/upload/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ocrResult?: OCRResult;
  };

  if (!body.ocrResult) {
    return NextResponse.json({ error: "ocrResult is required." }, { status: 400 });
  }

  try {
    const result = await runAnalysis(body.ocrResult);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Analysis processing failed."
      },
      { status: 500 }
    );
  }
}
