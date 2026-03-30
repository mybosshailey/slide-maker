import { NextResponse } from "next/server";
import { parseProblemFromOCR } from "@/features/problem-parse/service";
import type { OCRResult, QuestionTypeHint } from "@/features/upload/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ocrResult?: OCRResult;
    questionTypeHint?: QuestionTypeHint;
  };

  if (!body.ocrResult) {
    return NextResponse.json({ error: "ocrResult is required." }, { status: 400 });
  }

  try {
    const result = parseProblemFromOCR(
      body.ocrResult,
      body.questionTypeHint ?? "auto"
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Problem parsing failed."
      },
      { status: 500 }
    );
  }
}
