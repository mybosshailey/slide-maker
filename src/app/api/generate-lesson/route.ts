import { NextResponse } from "next/server";
import { runAnalysis } from "@/features/analysis/service";
import { runOCR } from "@/features/ocr/service";
import { parseProblemFromOCR } from "@/features/problem-parse/service";
import { generateSlideDraft } from "@/features/slides/service";
import type { CoverMetadata, QuestionTypeHint } from "@/features/upload/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fileId?: string;
    questionTypeHint?: QuestionTypeHint;
    coverMetadata?: CoverMetadata;
  };

  if (!body.fileId) {
    return NextResponse.json({ error: "fileId is required." }, { status: 400 });
  }

  try {
    const ocrResult = await runOCR(body.fileId);
    const parseResult = parseProblemFromOCR(
      ocrResult,
      body.questionTypeHint ?? "auto"
    );
    const analysisResult = await runAnalysis(parseResult);
    const slideDraft = generateSlideDraft(
      parseResult,
      analysisResult,
      body.coverMetadata
    );

    return NextResponse.json({
      ocrResult,
      parseResult,
      analysisResult,
      slideDraft
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Lesson generation failed."
      },
      { status: 500 }
    );
  }
}
