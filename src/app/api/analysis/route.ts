import { NextResponse } from "next/server";
import { runAnalysis } from "@/features/analysis/service";
import type { ProblemParseResult } from "@/features/upload/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    parseResult?: ProblemParseResult;
  };

  if (!body.parseResult) {
    return NextResponse.json({ error: "parseResult is required." }, { status: 400 });
  }

  try {
    const result = await runAnalysis(body.parseResult);
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
