import { NextResponse } from "next/server";
import { generateSlideDraft } from "@/features/slides/service";
import type { AnalysisResult, ProblemParseResult } from "@/features/upload/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    parseResult?: ProblemParseResult;
    analysisResult?: AnalysisResult;
  };

  if (!body.parseResult || !body.analysisResult) {
    return NextResponse.json(
      { error: "parseResult and analysisResult are required." },
      { status: 400 }
    );
  }

  try {
    const result = generateSlideDraft(body.parseResult, body.analysisResult);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Slide draft generation failed."
      },
      { status: 500 }
    );
  }
}
